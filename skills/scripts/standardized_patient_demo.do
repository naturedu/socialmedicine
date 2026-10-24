* Original teaching simulation; not run in Stata in this release.
clear all
set seed 20261024
set obs 36
gen clinic_id = _n
gen allocation_order = runiform()
sort allocation_order
gen arm = (_n > 18)
gen clinic_effect = rnormal(0, .45)
expand 12
bysort clinic_id: gen visit = _n
gen case_id = mod(visit-1,3)+1
gen actor_id = ceil(visit/3)
gen p = invlogit(-.55 + .5*arm + clinic_effect + .2*(case_id-2))
gen correct = (runiform() < p)
gen detected = (runiform() < .07)
assert inlist(correct,0,1)
assert _N == 432
tabstat detected, by(arm) stat(mean n)
* Equal clinic weighting; case and actor assignments are balanced by construction.
preserve
collapse (mean) correct, by(clinic_id arm)
assert _N == 36
regress correct i.arm, vce(robust)
lincom 1.arm
restore
* The individual-visit model is an alternative, not an independent replication.
regress correct i.arm i.case_id i.actor_id, vce(cluster clinic_id)
lincom 1.arm
* Few clusters, unbalanced case mixes and observational allocation require
* separate design-based decisions. Do not delete detected visits without a plan.
