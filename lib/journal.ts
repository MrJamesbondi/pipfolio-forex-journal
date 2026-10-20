export type Trade={id:string;pair:string;side:"long"|"short";lots:number;contractSize?:number;entryPrice:number;exitPrice:number;entryTime:string;exitTime:string;stop:number;target:number;commission:number;swap:number;setup:string;session:string;tags:string[];grade:string;emotion:string;confidence:number;followedPlan:boolean;thesis:string;review:string;mfePips:number;maePips:number;pnl:number;pips:number;r:number};
export const supportedPairs=["EURUSD","GBPUSD","AUDUSD","NZDUSD","XAUUSD"] as const;
const pairs=[...supportedPairs];
const setups=["London Breakout","Trend Pullback","S/R Flip Retest","News Fade","Asian Range Reversion","Supply & Demand"];
const sessions=["London","New York","Asia","Overlap"];
const tags=["Clean Entry","Trending","Patient","FOMO","High Volatility","A+ Setup","Ranging"];

// USD-quoted majors use a 100,000-unit standard lot; XAUUSD defaults to 100 troy ounces.
export function pipSizeFor(pair:string){return pair==="XAUUSD"?0.01:0.0001}
export function contractSizeFor(pair:string){return pair==="XAUUSD"?100:100_000}
export function pipValuePerLot(pair:string,contractSize=contractSizeFor(pair)){return pipSizeFor(pair)*contractSize}
export function calculateRecommendedLots(pair:string,entry:number,stop:number,balance:number,riskPercent:number,contractSize=contractSizeFor(pair)){
 const distance=Math.abs(entry-stop),riskMoney=balance*riskPercent/100,oneLotRisk=distance*contractSize;
 if(!Number.isFinite(oneLotRisk)||!Number.isFinite(riskMoney)||oneLotRisk<=0||riskMoney<=0)return 0;
 return Math.floor((riskMoney/oneLotRisk+1e-10)*100)/100;
}
export function enrich(t:Omit<Trade,"pnl"|"pips"|"r">):Trade{
 const contractSize=Number(t.contractSize)||contractSizeFor(t.pair),pip=pipSizeFor(t.pair);
 const move=t.side==="long"?t.exitPrice-t.entryPrice:t.entryPrice-t.exitPrice;
 const pips=move/pip,gross=move*contractSize*t.lots,pnl=gross-t.commission+t.swap;
 const initialRisk=Math.abs(t.entryPrice-t.stop)*contractSize*t.lots;
 return {...t,contractSize,pips,pnl,r:initialRisk?pnl/initialRisk:0};
}
export function generateTrades(count=300,seed=19):Trade[]{
 let x=seed;const rand=()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296};
 const now=Date.UTC(2026,9,20),bases:Record<string,number>={EURUSD:1.08,GBPUSD:1.27,AUDUSD:0.66,NZDUSD:0.61,XAUUSD:2400};
 return Array.from({length:count},(_,i)=>{
  const pair=pairs[Math.floor(rand()*pairs.length)],pip=pipSizeFor(pair),contract=contractSizeFor(pair),side:"long"|"short"=rand()>.5?"long":"short";
  const lots=[.1,.2,.25,.5,.75,1][Math.floor(rand()*6)],entry=bases[pair]+(rand()-.5)*(pair==="XAUUSD"?200:.12),win=rand()>.48;
  const move=(win?1:-1)*(win?.8+rand()*1.5:.6+rand()*.8),exit=entry+(side==="long"?1:-1)*move*pip*18;
  const stamp=new Date(now-(Math.floor(rand()*365)+Math.floor(i/count))*86400000-Math.floor(rand()*86400000)).toISOString(),duration=(.5+rand()*12)*3600000,commission=lots*7;
  return enrich({id:`seed-${i}`,pair,side,lots,contractSize:contract,entryPrice:entry,exitPrice:exit,entryTime:new Date(Date.parse(stamp)-duration).toISOString(),exitTime:stamp,stop:entry+(side==="long"?-1:1)*pip*18,target:entry+(side==="long"?1:-1)*pip*36,commission,swap:(rand()-.5)*4,setup:setups[Math.floor(rand()*setups.length)],session:sessions[Math.floor(rand()*sessions.length)],tags:[tags[Math.floor(rand()*tags.length)]],grade:["A+","A","B","C"][Math.floor(rand()*4)],emotion:"Calm",confidence:1+Math.floor(rand()*5),followedPlan:rand()>.18,thesis:"",review:"",mfePips:8+rand()*36,maePips:3+rand()*22});
 });
}
export function derive(trades:Trade[]){
 const pnl=trades.reduce((a,t)=>a+t.pnl,0),wins=trades.filter(t=>t.pnl>0),losses=trades.filter(t=>t.pnl<0);
 const grossWin=wins.reduce((a,t)=>a+t.pnl,0),grossLoss=-losses.reduce((a,t)=>a+t.pnl,0),hours=trades.map(t=>(Date.parse(t.exitTime)-Date.parse(t.entryTime))/3600000);
 const totalLots=trades.reduce((a,t)=>a+t.lots,0),costs=trades.reduce((a,t)=>a+t.commission-t.swap,0);
 return {pnl,wins:wins.length,losses:losses.length,grossWin,grossLoss,totalLots,avgLots:trades.length?totalLots/trades.length:0,costs,winRate:trades.length?wins.length/trades.length*100:0,profitFactor:grossLoss?grossWin/grossLoss:0,expectancy:trades.length?pnl/trades.length:0,avgR:trades.length?trades.reduce((a,t)=>a+t.r,0)/trades.length:0,avgHold:hours.length?`${(hours.reduce((a,b)=>a+b,0)/hours.length).toFixed(1)}h`:"—",longCount:trades.filter(t=>t.side==="long").length,shortCount:trades.filter(t=>t.side==="short").length};
}
