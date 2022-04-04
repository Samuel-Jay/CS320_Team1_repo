function taskReducer(state = {taskList:null , openTask:null, category:"UNCOMPLETE"}){
	switch(action.type){
	case "UNCOMPLETE":
		return { ...state,category:"UNCOMPLETE"};
	case "COMPLETE":
		return { ...state, category:"COMPLETE"};
	case "FAILED":
		return { ...state, category:"ARCHIVE"};
	case "GETTASK":
		return { ...state,  openTask: action.payload};
	default:
		return state;
	}

}

export default userReducer