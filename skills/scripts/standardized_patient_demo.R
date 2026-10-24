# Original teaching simulation. No patient data and no clinical recommendations.
# Balanced cases/actors at every clinic; inference is conditional on this set.
set.seed(20261024)
clinics <- data.frame(clinic_id=1:36, arm=sample(rep(0:1, each=18)))
visits <- merge(clinics, expand.grid(case_id=1:3, actor_id=1:4))
clinic_effect <- rnorm(36, 0, 0.45)
p <- plogis(-0.55 + 0.5*visits$arm + clinic_effect[visits$clinic_id] +
             c(-0.2,0,0.2)[visits$case_id])
visits$correct <- rbinom(nrow(visits), 1, p)
visits$detected <- rbinom(nrow(visits), 1, 0.07)
stopifnot(nrow(visits)==432, all(table(visits$clinic_id)==12))
clinic_scores <- aggregate(correct ~ clinic_id + arm, visits, mean)
# Clinic allocation means visits are not independent trial units.
comparison <- t.test(clinic_scores$correct[clinic_scores$arm==1],
                     clinic_scores$correct[clinic_scores$arm==0])
rd <- unname(diff(rev(comparison$estimate)))
stopifnot(abs(rd - (mean(clinic_scores$correct[clinic_scores$arm==1]) -
                   mean(clinic_scores$correct[clinic_scores$arm==0]))) < 1e-12)
print(data.frame(estimand='Equal-clinic mean risk difference (arm 1 minus 0)',
                 estimate=rd, lower=comparison$conf.int[1], upper=comparison$conf.int[2]))
# Detection is reported, not silently deleted; exclusions may select on treatment.
print(aggregate(detected ~ arm, visits, mean))
print(aggregate(correct ~ arm + case_id, visits, mean))
# For observational samples these contrasts are descriptive, not causal effects.
# Unbalanced scripts/actors, few clusters, or cross-classified random actors need
# a prespecified adjustment model and suitable uncertainty estimation.
stopifnot(all(visits$correct %in% 0:1), all(is.finite(comparison$conf.int)))
cat('PASS: 432 visits; 36 randomized clinics; balanced scripts; finite clinic-level interval\n')
