# Independent behavioral/invariant checks; base R only.
args <- commandArgs(trailingOnly = FALSE)
file_arg <- grep("^--file=", args, value = TRUE)
here <- if (length(file_arg)) dirname(sub("^--file=", "", file_arg[1])) else "scripts"
source(file.path(here, "microsimulation_demo.R"))
checks <- 0L
check <- function(value) { stopifnot(isTRUE(value)); checks <<- checks + 1L }
rejects <- function(expr) inherits(tryCatch({force(expr); NULL}, error = identity), "error")

probs <- competing_probabilities(rbind(c(0, 0), c(0.1, 0.2), c(1000, 0)), 0.5)
check(max(abs(rowSums(probs) - 1)) < 1e-12)
check(identical(unname(probs[1, ]), c(0, 0, 1)))
check(abs(probs[2, 1] / probs[2, 2] - 0.5) < 1e-12)
check(abs(probs[2, 3] - exp(-0.15)) < 1e-12)
check(rejects(competing_probabilities(matrix(-1, 1, 2))))
check(rejects(competing_probabilities(matrix(0, 1, 2), 0)))

pop <- make_population(200, 123); u <- make_uniforms(200, 15, 456)
p <- default_parameters(); p$onset_hr <- 1; p$intervention_cost <- 0
identity_result <- compare_strategies(pop, u, p)
check(all(identity_result$incremental == 0))
check(identical(identity_result$usual$final_state, identity_result$policy$final_state))

p$onset_rate <- p$progression_rate <- p$death_rate <- 0
p$discount_cost <- p$discount_qaly <- 0
flat <- simulate(pop, u, p, dt = 0.5)
check(all(flat$final_state == 1L))
check(max(abs(flat$qaly - 15 * 0.5 * 0.95)) < 1e-12)
check(max(abs(flat$cost - 15 * 0.5 * 300)) < 1e-10)

p$death_rate <- 1000
dead <- simulate(pop, u, p, dt = 0.5)
check(all(dead$final_state == 4L))
check(all(dead$trace$dead[-1] == 200))
check(all(dead$qaly == 0.95 * 0.5 / 2))
check(all(dead$cost == 300 * 0.5 / 2))

p <- default_parameters()
a <- compare_strategies(pop, u, p)
b <- compare_strategies(make_population(200, 123), make_uniforms(200, 15, 456), p)
check(identical(a, b))
for (scenario in c("usual", "policy")) {
  trace <- a[[scenario]]$trace
  check(all(rowSums(trace[-1]) == 200))
  check(all(diff(trace$dead) >= 0))
  check(all(a[[scenario]]$cost >= 0) && all(a[[scenario]]$qaly <= 15 * 0.95))
}
bad <- p; bad$onset_rate <- -0.1
check(rejects(simulate(pop, u, bad)))
check(rejects(simulate(pop, u[-1, ], p)))
bad_u <- u; bad_u[1, 1] <- 1
check(rejects(simulate(pop, bad_u, p)))
check(rejects(make_population(2.5)))

destination <- tempfile("microsimulation-validation-", tmpdir = ".")
result <- run_demo(100, 4, 3, 5, 1234, destination)
check(nrow(result$mcse) == 2 && all(is.finite(result$mcse$mcse_average)))
check(all(result$ceac$probability_cost_effective >= 0 & result$ceac$probability_cost_effective <= 1))
check(length(list.files(destination)) == 8)
cat("PASS:", checks, "behavioral/invariant checks; no real-data validation.\n")
