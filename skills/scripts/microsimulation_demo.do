* Original MIT teaching template. Fictitious parameters; NOT executed in Stata.
* No input data. Annual four-state first-event approximation; no PSA here.
version 16
args outdir
if `"`outdir'"' == "" local outdir "microsimulation-demo-stata"
capture mkdir `"`outdir'"'
preserve
clear
set seed 20261024
set obs 5000
gen double age0 = 65 + 10*runiform()
gen byte sex = runiform() < .5
gen double risk = exp(rnormal(-.02,.2))
forvalues t = 1/20 {
    gen double u`t' = runiform()
}
tempfile people summaries
save `people'
tempname report
postfile `report' str8 strategy double mean_cost mean_qaly using `summaries'
forvalues policy = 0/1 {
    use `people', clear
    gen byte state = 1
    gen double duration = 0
    gen double cost = 0
    gen double qaly = 0
    forvalues t = 1/20 {
        gen byte old = state
        gen double age = age0 + `t' - 1
        gen double death = .012*exp(.055*(age-65))*cond(old==1,1,cond(old==2,1.5,cond(old==3,2.2,0)))
        gen double disease = 0
        replace disease = .025*exp(.04*(age-65))*risk*(1+.15*sex)*cond(`policy'==1,.8,1) if old==1
        replace disease = .06*(1+.03*duration) if old==2
        gen double total = death + disease
        gen double pd = cond(total>0,death/total*(1-exp(-total)),0)
        gen double pp = cond(total>0,disease/total*(1-exp(-total)),0)
        assert !missing(pd,pp) & pd>=0 & pp>=0 & pd+pp<=1+1e-12
        replace state = 4 if old<4 & u`t'<pd
        replace state = 2 if old==1 & u`t'>=pd & u`t'<pd+pp
        replace state = 3 if old==2 & u`t'>=pd & u`t'<pd+pp
        assert state==4 if old==4
        assert inlist(state,1,2,3,4)
        gen double c0 = cond(old==1,300,cond(old==2,3000,cond(old==3,9000,0)))
        gen double c1 = cond(state==1,300,cond(state==2,3000,cond(state==3,9000,0)))
        gen double e0 = cond(old==1,.95,cond(old==2,.75,cond(old==3,.45,0)))
        gen double e1 = cond(state==1,.95,cond(state==2,.75,cond(state==3,.45,0)))
        gen double alive_time = ((old<4)+(state<4))/2
        replace cost = cost + ((c0+c1)/2+180*`policy'*alive_time+1000*(old==1 & state==2))/1.03^(`t'-.5)
        replace qaly = qaly + (e0+e1)/2/1.03^(`t'-.5)
        replace duration = duration+1 if inlist(old,2,3) & state<4
        replace duration = .5 if old==1 & state==2
        replace duration = 0 if state==4
        drop old age death disease total pd pp c0 c1 e0 e1 alive_time
    }
    quietly summarize cost
    local c = r(mean)
    quietly summarize qaly
    local e = r(mean)
    local label = cond(`policy'==0,"usual","policy")
    post `report' ("`label'") (`c') (`e')
}
postclose `report'
use `summaries', clear
list, noobs
export delimited using `"`outdir'/strategies_teaching.csv"', replace
restore
