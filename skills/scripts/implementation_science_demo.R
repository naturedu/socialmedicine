# Original teaching simulation: same clinical service, two implementation strategies.
set.seed(20261025)
d <- data.frame(site_id=1:40, strategy=sample(rep(0:1,each=20)))
d$eligible <- sample(50:100, 40, replace=TRUE)
d$adopted <- rbinom(40, 1, plogis(-0.1 + 0.6*d$strategy))
d$reached <- ifelse(d$adopted==1,
                    rbinom(40, d$eligible, plogis(-0.3 + 0.3*d$strategy)), 0)
d$completed <- rbinom(40, d$reached, 0.8)
safe_ratio <- function(num,den) ifelse(den>0,num/den,NA_real_)
d$reach <- safe_ratio(d$reached,d$eligible)
d$fidelity <- safe_ratio(d$completed,d$reached)
d$implementation_cost <- 500 + 15*d$reached
summary_by_arm <- do.call(rbind,lapply(split(d,d$strategy), function(x)
 data.frame(strategy=x$strategy[1], sites=nrow(x),
 adoption=mean(x$adopted), reach_person_weighted=sum(x$reached)/sum(x$eligible),
 reach_site_weighted=mean(x$reach), fidelity_among_reached=safe_ratio(sum(x$completed),sum(x$reached)),
 cost_per_reached=safe_ratio(sum(x$implementation_cost),sum(x$reached)))))
print(summary_by_arm)
# Primary example: strategy effect on equal-site reach, at one prespecified time.
fit <- t.test(d$reach[d$strategy==1],d$reach[d$strategy==0])
print(data.frame(reach_difference=unname(fit$estimate[1]-fit$estimate[2]),
                 lower=fit$conf.int[1],upper=fit$conf.int[2]))
# Fidelity conditions on reach. Its between-arm contrast is not automatically
# a causal strategy effect because reaching the service is post-allocation.
stopifnot(all(d$completed<=d$reached),all(d$reached<=d$eligible),
          is.na(safe_ratio(0,0)),all(is.na(d$fidelity[d$reached==0])),
          all(is.finite(fit$conf.int)))
cat('PASS: denominators, missing zero-denominator ratios, 40 randomized sites, finite interval\n')
