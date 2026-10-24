# Original MIT teaching implementation. Every parameter and person is fictitious.
# No data input, package installation, network calls or individual-level export.
positive_integer <- function(x, name, minimum = 1) {
  if (length(x) != 1L || !is.numeric(x) || !is.finite(x) ||
      x < minimum || x != floor(x)) stop(name, " must be an integer >= ", minimum)
  invisible(x)
}

default_parameters <- function() {
  list(onset_rate = 0.025, progression_rate = 0.06, death_rate = 0.012,
       onset_hr = 0.8, intervention_cost = 180, onset_cost = 1000,
       state_cost = c(300, 3000, 9000, 0), utility = c(0.95, 0.75, 0.45, 0),
       discount_cost = 0.03, discount_qaly = 0.03)
}

check_parameters <- function(p) {
  required <- names(default_parameters())
  if (!all(required %in% names(p))) stop("Missing parameters")
  scalar <- setdiff(required, c("state_cost", "utility"))
  for (nm in scalar) {
    x <- p[[nm]]
    if (!is.numeric(x) || length(x) != 1L || !is.finite(x) || x < 0)
      stop("Invalid nonnegative scalar: ", nm)
  }
  for (nm in c("state_cost", "utility")) {
    x <- p[[nm]]
    if (!is.numeric(x) || length(x) != 4L || any(!is.finite(x)))
      stop(nm, " must have four finite values")
  }
  if (any(p$state_cost < 0) || p$state_cost[4] != 0 ||
      any(p$utility > 1) || p$utility[4] != 0) stop("Invalid state rewards")
  invisible(p)
}

make_population <- function(n = 5000, seed = 20261024) {
  positive_integer(n, "n"); positive_integer(seed, "seed", 0)
  set.seed(seed)
  data.frame(age = runif(n, 65, 75), sex = rbinom(n, 1, 0.5),
             risk = exp(rnorm(n, -0.02, 0.2)))
}

make_uniforms <- function(n, cycles, seed) {
  positive_integer(n, "n"); positive_integer(cycles, "cycles")
  positive_integer(seed, "seed", 0)
  set.seed(seed)
  # Always allocate draws for all persons/cycles, including those who later die.
  matrix(runif(n * cycles), nrow = n, ncol = cycles)
}

competing_probabilities <- function(rates, dt = 1) {
  rates <- as.matrix(rates)
  if (!is.numeric(rates) || ncol(rates) < 1 || any(!is.finite(rates)) ||
      any(rates < 0) || length(dt) != 1 || !is.finite(dt) || dt <= 0)
    stop("Rates must be finite/nonnegative and dt must be positive")
  total <- rowSums(rates)
  if (any(!is.finite(total))) stop("Total hazard overflow")
  event <- -expm1(-total * dt)
  result <- rates / ifelse(total == 0, 1, total) * event
  result <- cbind(result, stay = exp(-total * dt))
  stopifnot(all(result >= 0), all(result <= 1),
            all(abs(rowSums(result) - 1) < 1e-12))
  result
}

simulate <- function(pop, uniforms, p = default_parameters(), strategy = FALSE, dt = 1) {
  check_parameters(p)
  if (!is.data.frame(pop) || !all(c("age", "sex", "risk") %in% names(pop)) ||
      nrow(pop) == 0 || any(!is.finite(as.matrix(pop[c("age", "sex", "risk")])) ) ||
      any(pop$age < 0) || any(!pop$sex %in% 0:1) || any(pop$risk <= 0))
    stop("Invalid synthetic population")
  if (!is.logical(strategy) || length(strategy) != 1L || is.na(strategy))
    stop("strategy must be TRUE or FALSE")
  if (!is.matrix(uniforms) || nrow(uniforms) != nrow(pop) || ncol(uniforms) < 1 ||
      any(!is.finite(uniforms)) || any(uniforms < 0 | uniforms >= 1))
    stop("Invalid uniform matrix")
  if (!is.numeric(dt) || length(dt) != 1L || !is.finite(dt) || dt <= 0) stop("Invalid dt")
  n <- nrow(pop); cycles <- ncol(uniforms)
  # 1 healthy, 2 mild, 3 severe, 4 dead. All persons start healthy in this demo.
  state <- rep(1L, n); duration <- cost <- qaly <- numeric(n)
  counts <- matrix(0L, cycles + 1L, 4L)
  counts[1, ] <- tabulate(state, nbins = 4)
  hr <- if (strategy) p$onset_hr else 1
  policy_cost <- if (strategy) p$intervention_cost else 0
  for (t in seq_len(cycles)) {
    old <- state
    age <- pop$age + (t - 1) * dt
    death <- p$death_rate * exp(0.055 * (age - 65)) * c(1, 1.5, 2.2, 0)[old]
    disease <- numeric(n)
    healthy <- old == 1L; mild <- old == 2L
    disease[healthy] <- p$onset_rate * exp(0.04 * (age[healthy] - 65)) *
      pop$risk[healthy] * (1 + 0.15 * pop$sex[healthy]) * hr
    disease[mild] <- p$progression_rate * (1 + 0.03 * duration[mild])
    prob <- competing_probabilities(cbind(death, disease), dt)
    u <- uniforms[, t]
    died <- old != 4L & u < prob[, 1]
    progressed <- old != 4L & u >= prob[, 1] & u < prob[, 1] + prob[, 2]
    state[died] <- 4L
    state[progressed & healthy] <- 2L
    state[progressed & mild] <- 3L
    new_onset <- healthy & state == 2L
    midpoint <- (t - 0.5) * dt
    alive_time <- dt * ((old != 4L) + (state != 4L)) / 2
    cost <- cost + ((p$state_cost[old] + p$state_cost[state]) * dt / 2 +
      policy_cost * alive_time + p$onset_cost * new_onset) /
      (1 + p$discount_cost)^midpoint
    qaly <- qaly + (p$utility[old] + p$utility[state]) * dt / 2 /
      (1 + p$discount_qaly)^midpoint
    duration[old %in% 2:3 & state != 4L] <- duration[old %in% 2:3 & state != 4L] + dt
    duration[new_onset] <- dt / 2
    duration[state == 4L] <- 0
    counts[t + 1L, ] <- tabulate(state, nbins = 4)
    stopifnot(sum(counts[t + 1L, ]) == n, all(state[old == 4L] == 4L),
              all(state %in% 1:4), all(is.finite(cost)), all(is.finite(qaly)))
  }
  trace <- data.frame(time = (0:cycles) * dt, counts)
  names(trace) <- c("time", "healthy", "mild", "severe", "dead")
  list(cost = cost, qaly = qaly, final_state = state, duration = duration, trace = trace)
}

compare_strategies <- function(pop, uniforms, p = default_parameters(), dt = 1) {
  usual <- simulate(pop, uniforms, p, FALSE, dt)
  policy <- simulate(pop, uniforms, p, TRUE, dt)
  list(summary = data.frame(strategy = c("usual", "policy"),
                           mean_cost = c(mean(usual$cost), mean(policy$cost)),
                           mean_qaly = c(mean(usual$qaly), mean(policy$qaly))),
       incremental = c(delta_cost = mean(policy$cost - usual$cost),
                       delta_qaly = mean(policy$qaly - usual$qaly)),
       usual = usual, policy = policy)
}

run_demo <- function(n = 5000, cycles = 20, reps = 8, psa_draws = 40,
                     seed = 20261024, out = "microsimulation-demo") {
  positive_integer(n, "n"); positive_integer(cycles, "cycles")
  positive_integer(reps, "reps", 2); positive_integer(psa_draws, "psa_draws", 2)
  positive_integer(seed, "seed", 0)
  if (seed > .Machine$integer.max - reps - 3) stop("Seed too large")
  pop <- make_population(n, seed); p <- default_parameters()
  u <- make_uniforms(n, cycles, seed + 1)
  base <- compare_strategies(pop, u, p)
  draws <- t(vapply(seq_len(reps), function(r) {
    compare_strategies(pop, make_uniforms(n, cycles, seed + 1 + r), p)$incremental
  }, numeric(2)))
  repeat_results <- data.frame(replication = seq_len(reps), draws)
  mcse <- data.frame(outcome = colnames(draws), estimate = colMeans(draws),
                    mcse_single_run = apply(draws, 2, sd),
                    mcse_average = apply(draws, 2, sd) / sqrt(reps),
                    conditional_on = "fixed synthetic population and parameters")
  set.seed(seed + reps + 3)
  # These are arbitrary teaching distributions, not fitted evidence.
  hrs <- rlnorm(psa_draws, log(0.8), 0.12)
  costs <- rgamma(psa_draws, shape = 25, scale = 180 / 25)
  psa <- do.call(rbind, lapply(seq_len(psa_draws), function(b) {
    pars <- p; pars$onset_hr <- hrs[b]; pars$intervention_cost <- costs[b]
    result <- compare_strategies(pop, u, pars)$incremental
    data.frame(draw = b, onset_hr = hrs[b], intervention_cost = costs[b],
               delta_cost = unname(result[1]), delta_qaly = unname(result[2]))
  }))
  ceac <- data.frame(wtp = c(0, 50000, 100000, 200000))
  ceac$probability_cost_effective <- vapply(ceac$wtp, function(w) {
    mean(w * psa$delta_qaly - psa$delta_cost > 0)
  }, numeric(1))
  if (!is.character(out) || length(out) != 1L || is.na(out) || !nzchar(out)) stop("Invalid output directory")
  dir.create(out, recursive = TRUE, showWarnings = FALSE)
  save_csv <- function(x, name) write.csv(x, file.path(out, name), row.names = FALSE)
  save_csv(base$summary, "strategies.csv")
  save_csv(as.data.frame(as.list(base$incremental)), "incremental.csv")
  save_csv(rbind(cbind(strategy = "usual", base$usual$trace),
                 cbind(strategy = "policy", base$policy$trace)), "state_trace.csv")
  save_csv(repeat_results, "replications.csv"); save_csv(mcse, "mcse.csv")
  save_csv(psa, "psa_teaching.csv"); save_csv(ceac, "ceac_teaching.csv")
  capture.output(dput(list(n = n, cycles = cycles, dt_years = 1, reps = reps,
                           psa_draws = psa_draws, seed = seed, parameters = p,
                           scope = "fictitious teaching model; not real policy evidence")),
                 sessionInfo(), file = file.path(out, "run_info.txt"))
  list(comparison = base$summary, incremental = base$incremental,
       mcse = mcse, psa = psa, ceac = ceac)
}

if (sys.nframe() == 0L) {
  args <- commandArgs(trailingOnly = TRUE)
  if (length(args) == 0L) destination <- "microsimulation-demo"
  else if (length(args) == 2L && args[1] == "--out") destination <- args[2]
  else stop("Usage: Rscript microsimulation_demo.R [--out DIRECTORY]")
  result <- run_demo(out = destination)
  print(result$comparison); print(result$mcse)
  cat("Fictitious teaching output written to:", destination, "\n")
}
