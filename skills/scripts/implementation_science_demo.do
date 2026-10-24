* Teaching template. Not run in Stata in this release.
clear all
set seed 20261025
set obs 40
gen site_id = _n
gen allocation_order = runiform()
sort allocation_order
gen strategy = (_n > 20)
gen eligible = 50 + floor(51*runiform())
gen adopted = runiform() < invlogit(-.1+.6*strategy)
gen reached = rbinomial(eligible, invlogit(-.3+.3*strategy)) if adopted==1
replace reached = 0 if adopted==0
gen completed = rbinomial(reached,.8)
gen reach = reached/eligible if eligible>0
gen fidelity = completed/reached if reached>0
gen implementation_cost = 500+15*reached
assert completed<=reached & reached<=eligible
assert missing(fidelity) if reached==0
tabstat adopted reach fidelity, by(strategy) stat(mean n)
* Site-weighted reach contrast. Zero reach remains in the primary analysis.
regress reach i.strategy, vce(robust)
lincom 1.strategy
* Person-weighted summaries use pooled numerators AND denominators.
preserve
collapse (sum) reached eligible completed implementation_cost, by(strategy)
gen pooled_reach = reached/eligible
gen pooled_fidelity = completed/reached if reached>0
gen cost_per_reached = implementation_cost/reached if reached>0
list, noobs
restore
* These are different estimands; do not equate a conditional fidelity contrast
* with a randomized strategy effect on everyone originally eligible.
