import React, {useState} from "react";
import {selectTask} from "../../actions/Task.js"
import {useDispatch, useSelector} from "react-redux";
import {openTask, closeTask} from "../../actions/Task.js";
import {Checkbox, Button, Menu, MenuItem}  from "@mui/material";

function Task(task){
    const dispatch = useDispatch();
    const[background,setbackground] = useState("#ffff");
    const[width_task,setwidth_task] = useState("100%");
    const [anchorEl, setAnchorEl] = useState(null);
    const checked = useSelector((state) => state.TrainingTask.selectTask).includes(task.task)

    function handleClose(){
        setAnchorEl(null);
    }
    function handleClick(event){
        setAnchorEl(event.currentTarget);
    }

    function changeWidth(){
        setwidth_task("70%");
    }
    function changeBackground(){
        setbackground("#F0F2F5");
    }
    function changeStatus(task){
        dispatch(selectTask(task.task));
    }
    function handleWindow(task){
        dispatch(openTask(task.task));
    }
    function closeWindow(){
        dispatch(closeTask());
    }
    return (
        <div className="EmailRow" style={{ backgroundColor: background,width :width_task }} onClick={()=>{changeBackground();changeWidth();handleWindow(task)}}>
            <Checkbox  size="small" checked={checked} onChange={() => changeStatus(task)} style ={{color: "#199086",}}  />
            <div className="EmailRow_title">
                {task.task.assignerEmail}
            </div>
            <div className="EmailRow_Subject">
                
                <h4>
                    {task.task.taskName+":"}
                    <span className="EmailRow_Description">
                        {task.task.taskDescription}
                    </span>
                </h4>
            </div>
            <div className="EmailRow_time">
                {task.task.dueDate.split("T")[0].split("-")[1]+"/"+task.task.dueDate.split("T")[0].split("-")[2]+"/"+task.task.dueDate.split("T")[0].split("-")[0]}
            </div>
        </div>
                                                                           )
}

export default Task;
