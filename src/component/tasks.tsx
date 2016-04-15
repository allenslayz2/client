import React = require("react")
import {taskStore, appStore} from "../store"
import {createSortOnProperty, bytesToSize} from "../util"
import {socket, sendCommandToDefault} from "../socket"
import {Stats, LoadingScreen} from "./"
import {Button, Input, Glyphicon} from "react-bootstrap"
import setIntervals from "../interval"
import {intervals} from "../api-layer"

export class ProcessCreator extends React.Component<{}, {exe: string, box?: any}> {
    startProcess = () => {
        if (this.state && this.state.exe) {
            console.log(this.state.exe)
            sendCommandToDefault("startProcess", this.state.exe)
            if (this.state.box) {
                this.state.box.value = ""
            }
        }
        
    }
    render() {
        const createButton = <Button bsStyle="primary" onClick={this.startProcess}><Glyphicon glyph="plus"/></Button>
        return <div>
            <Input 
            type="text" 
            placeholder="Start new process..." 
            onChange={e => this.setState({exe: e.target.value, box: e.target})} 
            onKeyDown={(e) => {
                if (e.keyCode == 13) {
                    this.startProcess()
                    //e.target.value = ""
                }
            }}
            buttonAfter={createButton}/>
        </div>
    }
}

export class TaskList extends React.Component<
    {},
    {tasks?: Array<TaskInfo>, sortProperty?: string, sortType?: string}
> {
    columns: {[key:string]: string}
    constructor(props) {
        super(props)
        this.state = {tasks: [], sortProperty: "id", sortType: "asc"}
        this.onChange = this.onChange.bind(this)
        this.columns = {name: "Name", id: "ID", cpuUsage: "CPU", ramUsage: "Memory"}
    }
    componentDidMount() {
        taskStore.listen(this.onChange)
        if (appStore.getState().auth.loggedIn) {
            _.assign(intervals, setIntervals())
            this.setState(taskStore.getState())
        }
    }
    componentWillUnmount() {
        taskStore.unlisten(this.onChange)
        console.log(intervals)
        _.forEach(intervals, (v: number, k) => {
            clearInterval(v)
        })
    }
    getName(property: string) {
        if (this.state.sortProperty == property) {
            return <span>
                <Glyphicon glyph={(this.state.sortType == "asc" ? "menu-up" : "menu-down")} /> 
                <br />
                {this.columns[property]}
            </span>
        }
        else {
            return <span>{this.columns[property]}</span>
        }
    }
    onChange(tasks) {
        this.setState(tasks)
    }
    setSort(prop: string) {
        if (this.state.sortProperty == prop) {
            this.setState({ sortType: (this.state.sortType == "asc" ? "desc" : "asc") })
        }
        else {
            this.setState({sortProperty: prop})
        }
    }
    render() {
        if (this.state.tasks.length == 0) {
            return <LoadingScreen>
                Loading task list
            </LoadingScreen>
            /*
            return (
                <p>Loading task list; hang on pleaaase...</p>
            )
            */
        }
        if (this.state.sortProperty.length > 0) {
            this.state.tasks.sort(createSortOnProperty<TaskInfo>(this.state.sortProperty, this.state.sortType))
        }
        return (
            <table className="table">
                <thead>
                    <tr>
                        <th>Icon</th>
                        <th className="task-name-head" onClick={() => this.setSort("name")}>{this.getName("name")}</th>
                        <th className="task-id-head" onClick={() => this.setSort("id")}>{this.getName("id")}</th>
                        <th className="task-cpu-head" onClick={() => this.setSort("cpuUsage")}>{this.getName("cpuUsage")}</th>
                        <th className="task-memory-head" onClick={() => this.setSort("ramUsage")}>{this.getName("ramUsage")}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        this.state.tasks.map(task => {
                            return (<Task key={task.id} info={task} />)
                        })
                    }
                </tbody>
            </table>
        )
    }
}

export class Task extends React.Component<
    {key: number, info: TaskInfo},
    {expanded?: boolean, gonnaDie?: boolean}> {
    constructor(props) {
        super(props)
        this.state = {expanded: false, gonnaDie: false}
    }
    killSelf = () => {
        sendCommandToDefault("killProcess", this.props.info.id.toString())
    }
    closeButton() {
        return (this.state.gonnaDie ?
            <button onClick={this.killSelf}
                    className="btn btn-danger btn-sm animated fadeInRight"
                    style={{position: "absolute", marginLeft: -80, marginTop: -7}}>
                Confirm
            </button>
            : false)
    }
    render() {
        if (!this.state.expanded) {
            return (
                //onClick={() => this.setState({expanded: true})}
                //<button className="btn btn-danger">confirm</button>
                <tr>
                    <td style={{width: "39px"}}>
                        <img src={"data:image/png;base64," + this.props.info.icon} />
                    </td>
                    <td className="task-name">{this.props.info.name}</td>
                    <td className="task-id" style={{width: 20}}>{this.props.info.id}</td>
                    <td className="task-cpu" style={{width: 20}}>{this.props.info.cpuUsage + "%"}</td>
                    <td className="task-memory">{bytesToSize(this.props.info.ramUsage)}</td>
                    <td
                    className="close-button"
                    onClick={() => this.setState({gonnaDie: !this.state.gonnaDie})}
                    style={{width: 60, textAlign: "right"}}>
                        {this.closeButton()}
                        <span className={"glyphicon " + (this.state.gonnaDie ?
                            "glyphicon-ban-circle":"glyphicon-remove")}></span>
                    </td>
                </tr>
            )
        }
        else {
            return (
                <tr onClick={() => this.setState({expanded: false})}>
                    <td colSpan={5}>ssssssssssssssssssssssssssssssssssssssssssss</td>
                </tr>
            )
        }
    }
}

export function TaskPage(props: any) {
    return <div className="task-page">
        <div className="row">
            
        </div>
        <div className="row">
            <div className="col-md-8" style={{minHeight: "600px"}}>
                <ProcessCreator />
                <TaskList />
            </div>
            <div className="col-md-4">
                <Stats />
            </div>
        </div>
    </div>
}