interface optionsInterface{
	value:any;
	onChange: Function;
	args: Array<State>;
}
interface subInterface{
	type: "normal" | "dependent";
	update: Function;
	args: Array<State>
}
class State{
	#name:string;
	#value:any;
	#updateFunc: Function;
	#args: Array<State>;
	#subs: Array<subInterface> = []
	constructor(
		name:string,
		options: optionsInterface = {
			value:null,
			onChange: () =>{},
			args: []
		}){
		this.#name = name;
		this.#value = options.value
		this.#updateFunc =options. onChange
		this.#args = options.args
	}
	set(value:any):boolean{
		this.#value = value
		this.#updateFunc(this.#value,...this.#args)
		return true
	}
	get(): any{
		return this.#value
	}
	onChange(update: Function,args:Array<State> = []): void{
		this.#updateFunc = update
		this.#args = args
	}
	sub(opt:subInterface): boolean{
		this.#subs.push(opt)
		return true
	}
}

interface smInterface {
	(): any;
	states: Record<string,State>
	new: Function;
	del: Function;
}
const sm: smInterface = function(state:string = ''){
	if(state){
		return sm.states[state]
	}
}
sm.states = {};
sm.new = (name:string,options:optionsInterface): boolean => {
	sm.states[name] = new State(name,options)
	return true
}
sm.del = (name:string): boolean => {
	delete sm.states[name];
	return true
}
