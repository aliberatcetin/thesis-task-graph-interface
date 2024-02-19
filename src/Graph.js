import React from "react";
import {GraphView} from "react-digraph";
import services from "./services";

const SORT = "sort";
const FILE = "file";
const NODE = "node";

const TYPES = {
    [SORT]: SORT,
    [FILE]: FILE,
    [NODE]: NODE
};
const INTERVAL_TIMEOUT = 200;
const NODE_STATES = {
    SELECTED: "SELECTED",
    READY: "READY",
    RUNNING: "RUNNING",
    ERROR: "ERROR",
    TERMINATED: "TERMINATED"
}

const DATA_TYPES = {
    INTEGER: "INTEGER"
}

const EMPTY_EDGE_TYPE = "emptyEdge";

const GraphConfig = {
    NodeTypes: {
        task: {
            // required to show empty nodes
            typeText: "Task",
            shapeId: "#text", // relates to the type property of a node
            shape: (
                <symbol viewBox="0 0 100 100" id="text" key="0">
                    <circle cx="50" cy="50" r="45"/>
                </symbol>
            )
        },
        button: {
            // required to show empty nodes
            typeText: "Button",
            shapeId: "#button", // relates to the type property of a node
            shape: (
                <symbol viewBox="0 0 100 100" id="button" key="0">
                    <circle cx="50" cy="50" r="45"/>
                </symbol>
            )
        },
        chat: {
            // required to show empty nodes
            typeText: "Chat",
            shapeId: "#chat", // relates to the type property of a node
            shape: (
                <symbol viewBox="0 0 100 100" id="chat" key="0">
                    <circle cx="50" cy="50" r="45"/>
                </symbol>
            )
        }
    },
    NodeSubtypes: {},
    EdgeTypes: {
        emptyEdge: {
            // required to show empty edges
            shapeId: "#emptyEdge",
            // edge type could be "wait" or "delay" and
            // the target node's wait time could be displayed in the edge (in the arrow)
            shape: <span id="emptyEdge"/>
            /*shape: (
              <symbol viewBox="0 0 50 50" id="emptyEdge" key="0">
                <circle cx="25" cy="25" r="8" fill="currentColor">
                  {" "}
                </circle>
              </symbol>
            )*/
        }
    }
};

const NODE_KEY = "id"; // Allows D3 to correctly update DOM

export default class Graph extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            lastSelectedElement: null,
            intervalId:null,
            graph: {
                nodes: [],
                edges: []
                /*nodes: [
                    {
                        id: "1",
                        title: "asd",
                        task: "sort",
                        type: "task",
                        inputSource: "node",
                        output: "text",
                        input: "text",
                        x: -200,
                        y: 200
                    },
                    {
                        id: "2",
                        title: "naptın",
                        inputSource: "file",
                        task: "sort",
                        type: "task",
                        output: "text",
                        input: "text",
                        x: 0,
                        y: 100
                    }
                ],
                edges: [
                    {source: "1", target: "2", type: "empty"}
                ]*/
            },
            selected: null
        };
    }

    keypress = key => {
        console.log(this.state.lastSelectedElement, this.state.graph.edges);

        if (key["key"] === "Backspace" && this.state.lastSelectedElement !== null && this.state.lastSelectedElement.hasOwnProperty("source")) {
            var newEdges = this.state.graph.edges.filter(edge => edge["source"] !== this.state.lastSelectedElement["source"] && edge["target"] !== this.state.lastSelectedElement["target"])
            var targetNodeIndex = this.getNodeIndexById(this.state.lastSelectedElement.target);
            var newDeps = this.state.graph.nodes[targetNodeIndex]["dependencies"].filter(task => task["id"] !== this.state.lastSelectedElement["source"])
            this.state.graph.edges = newEdges;
            this.state.graph.nodes[targetNodeIndex]["dependencies"] = newDeps;
            services.apiService.detachRelation(this.state.lastSelectedElement.target, this.state.lastSelectedElement.source).then(r => console.log(r));
            this.setState({
                graph
            });

        }
    }

    setGraph = async () => {
        const result = await services.apiService.fetchGraph();
        graph.edges = result["edges"];
        graph.nodes = result["nodes"];
        this.setState({
            graph
        });
    }

    async componentDidMount() {

        await this.setGraph()

        document.addEventListener("keydown", this.keypress, false);

        clearInterval(this.state.intervalId);
        var intervalId = setInterval(this.setGraph, INTERVAL_TIMEOUT);
        this.setState({intervalId:intervalId});
        // store intervalId in the state so it can be accessed later:
        //this.setState({intervalId: intervalId});
    }


    onCreateNode = (x, y, a) => {
        const id= UUID();
        const node = {
            id:id,
            title: "Task Type",
            x,
            y,
            dataType: DATA_TYPES.INTEGER,
            taskState: NODE_STATES.READY,
            input: "",
            inputSource: FILE,
            output: id+".txt",
            task: SORT,
            type: "task"
        };


        services.apiService.createNode(node).then(r => {
            console.log("create", r);
            this.setState(state => {
                state.graph.nodes = state.graph.nodes.concat(r);
                return state;
            });
        });
    };

    onSelectNode = node => {
        const selected = this.state.selected;
        console.log("select node", node);
        if(node===null){
            clearInterval(this.state.intervalId);
            var interval = setInterval(this.setGraph,INTERVAL_TIMEOUT);
            this.setState({intervalId:interval});
        }else{
            clearInterval(this.state.intervalId);
            this.setState({intervalId:null});
        }
        this.setState({lastSelectedElement: node});

        console.log(this.state);
        if (node && (!selected || selected[NODE_KEY] !== node[NODE_KEY])) {
            this.setState({
                selected: node
            });
        } else if (!node && selected) {
            this.setState({
                selected: null
            });
        }
    };

    onUpdateNode = viewNode => {

        console.log("update node", viewNode);
        const graph = this.state.graph;
        const i = this.getNodeIndex(viewNode);

        graph.nodes[i] = viewNode;
        this.setState({graph});
        services.apiService.updateNode(graph.nodes[i]).then(r => console.log(r));

    };

    onDeleteNode = (node, nodeId, nodeArr) => {
        console.log("delete node", node);
        services.apiService.deleteNode(nodeId).then(r => console.log(r));

        const graph = this.state.graph;
        // Delete any connected edges
        const newEdges = graph.edges.filter((edge, i) => {
            return edge.source !== node[NODE_KEY] && edge.target !== node[NODE_KEY];
        });

        graph.nodes = nodeArr;
        graph.edges = newEdges;

        this.setState({graph, selected: null});
    };

    onSelectEdge = (edge) => {
        this.setState({lastSelectedElement: edge});
        console.log("select edge", edge);
    };

    onCreateEdge = (sourceViewNode, targetViewNode) => {
        const graph = this.state.graph;
        const type = EMPTY_EDGE_TYPE;

        const viewEdge = {
            source: sourceViewNode[NODE_KEY],
            target: targetViewNode[NODE_KEY],
            type
        };


        if (viewEdge.source === viewEdge.target) {
            return;
        }

        services.apiService.isTherePath(targetViewNode.id, sourceViewNode.id).then(r => {
            if (r === true) {
                return;
            }
            if (targetViewNode.hasOwnProperty("dependencies"))
                targetViewNode["dependencies"].push(sourceViewNode);
            else
                targetViewNode["dependencies"] = [sourceViewNode]


            services.apiService.updateNode(targetViewNode).then(r => {
                console.log(r);
                graph.edges = [...graph.edges, viewEdge];
                this.setState({
                    graph,
                    selected: viewEdge
                });
            });
        });


    };

    onSwapEdge = () => {
        console.log("swap edge");
    };

    onDeleteEdge = (sourceViewNode, targetViewNode) => {
        console.log("swap edge");
        console.log(sourceViewNode, targetViewNode);
        console.log("swap edge");
    };

    getNodeIndex(searchNode) {
        return this.state.graph.nodes.findIndex(node => {
            return node[NODE_KEY] === searchNode[NODE_KEY];
        });
    }

    getNodeIndexById(id) {
        return this.state.graph.nodes.findIndex(node => {
            return node[NODE_KEY] === id;
        });
    }

    // Helper to find the index of a given edge
    getEdgeIndex(searchEdge) {
        return this.state.graph.edges.findIndex(edge => {
            return (
                edge.source === searchEdge.source && edge.target === searchEdge.target
            );
        });
    }


    updateSelectedInput = e => {
        const graph = this.state.graph;
        const selected = this.state.selected;

        const input = e.target.value;

        selected.input = input;


        const i = this.getNodeIndex(selected);
        graph.nodes[i].input = input;
        services.apiService.updateNode(graph.nodes[i]).then(r => console.log(r));



        this.setState({
            graph,
            selected
        });
    };

    updateSelectedOutput = e => {
        const graph = this.state.graph;
        const selected = this.state.selected;

        const input = e.target.value;
        selected.output = input;

        const i = this.getNodeIndex(selected);
        services.apiService.updateNode(graph.nodes[i]).then(r => console.log(r));

        graph.nodes[i].output = input;

        this.setState({
            graph,
            selected
        });
    };

    updateSelectedNodeTitle = e => {
        const graph = this.state.graph;
        const selected = this.state.selected;

        const title = e.target.value;
        selected.title = title;

        const i = this.getNodeIndex(selected);
        services.apiService.updateNode(graph.nodes[i]).then(r => console.log(r));

        graph.nodes[i].title = title;

        this.setState({
            graph,
            selected
        });
    };

    updateSelectedInputSource = e => {
        const graph = this.state.graph;
        const selected = this.state.selected;

        const type = e.target.value;

        if (type in TYPES) {
            selected.inputSource = type;

            const i = this.getNodeIndex(selected);
            graph.nodes[i].inputSource = type;
            services.apiService.updateNode(graph.nodes[i]).then(r => console.log(r));

            this.setState({
                graph,
                selected
            });
        }
    };

    updateSelectedTaskType = e => {
        const graph = this.state.graph;
        const selected = this.state.selected;

        const task = e.target.value;


        selected.task = task;

        const i = this.getNodeIndex(selected);
        graph.nodes[i].task = task;
        services.apiService.updateNode(graph.nodes[i]).then(r => console.log(r));

        this.setState({
            graph,
            selected
        });

    };

    updateSelectedDataType = e => {
        const graph = this.state.graph;
        const selected = this.state.selected;

        const type = e.target.value;

        if (type in TYPES) {
            selected.type = type;

            const i = this.getNodeIndex(selected);
            graph.nodes[i].dataType = type;
            services.apiService.updateNode(graph.nodes[i]).then(r => console.log(r));

            this.setState({
                graph,
                selected
            });
        }
    };

    renderBackground = (e) => {
        return null;
        if (e.current != null) {
            if (e.current.id != null) {
                return (
                    <svg height="200" width="200">
                        <circle cx="100" cy="100" r="100"
                                fill="red"/>
                    </svg>
                )
            }
        } else {
            return (
                <svg height="200" width="200">
                    <circle cx="100" cy="0" r="100"
                            fill="gray"/>
                </svg>
            )
        }


    }

    renderNodeColor = (state, id) => {

        if(this.state.lastSelectedElement!==null && id === this.state.lastSelectedElement.id){
            return "lightblue";
        }
        switch (state) {
            case NODE_STATES.ERROR:
                return "red";
            case NODE_STATES.READY:
                return "gray";
            case NODE_STATES.RUNNING:
                return "orange";
            case NODE_STATES.TERMINATED:
                return "green";
        }
        return "yellow";
    }

    runTask = () => {
        var node = this.state.lastSelectedElement;
        const i = this.getNodeIndex(node);
        graph.nodes[i].taskState = NODE_STATES.RUNNING;
        services.apiService.runNode(node).then(r => console.log(r));
        this.setState({
            graph
        });
    }

    runTaskBulk = () => {
        services.apiService.runNodeBulk();
    }

    render() {
        const nodes = this.state.graph.nodes;
        const edges = this.state.graph.edges;
        const selected = this.state.selected;

        const NodeTypes = GraphConfig.NodeTypes;
        const NodeSubtypes = GraphConfig.NodeSubtypes;
        const EdgeTypes = GraphConfig.EdgeTypes;

        return (
            <div>


                {
                    /*  <div>
                      <p>Shift+click creates a new node</p>
                      <p>Shift+click a node and drag to another node creates an edge</p>
                      <p>Click a node and pressing delete deletes the node and its edges</p>
                      <p>
                          Node text and type can be changed after selecting a node by clicking
                          it
                      </p>
                  </div>*/
                }
                <div id="graph">
                    <GraphView
                        ref="GraphView"
                        nodeKey={NODE_KEY}
                        nodes={nodes}
                        edges={edges}

                        renderNodeText={data => {

                            return (
                                <foreignObject x='-100' y='-100' width='200' height='200' style={{
                                    backgroundColor: this.renderNodeColor(data.taskState, data.id),
                                    borderRadius: 200
                                }}>

                                    <div className='node' style={{
                                        alignItems: "center",
                                        backgroundColor: "transparent",
                                        width: "70%",
                                        height: "80%",
                                        marginLeft: "20%",
                                        marginTop: "10%"
                                    }}>


                                        <p style={{fontSize: 13, fontWeight: "bold"}}>{data.title}: {data.task}</p>
                                        <p style={{fontSize: 13, fontWeight: "bold"}}>input: {data.input}</p>
                                        <p style={{fontSize: 13, fontWeight: "bold"}}>output: {data.output}</p>
                                        <p style={{fontSize: 13, fontWeight: "bold"}}>input
                                            source: {TYPES[data.inputSource]}</p>

                                        <p style={{fontSize: 13, fontWeight: "bold"}}>Data
                                            type: {DATA_TYPES[data.dataType]}</p>

                                        <p style={{fontSize: 13, fontWeight: "bold"}}>Run log
                                            : {DATA_TYPES[data.runLog]}</p>
                                    </div>

                                </foreignObject>
                            )
                        }}
                        selected={selected}
                        nodeTypes={NodeTypes}
                        nodeSubtypes={NodeSubtypes}
                        edgeTypes={EdgeTypes}
                        onCreateNode={this.onCreateNode}
                        onSelectNode={this.onSelectNode}
                        onUpdateNode={this.onUpdateNode}
                        onDeleteNode={this.onDeleteNode}
                        onSelectEdge={this.onSelectEdge}
                        onCreateEdge={this.onCreateEdge}
                        onSwapEdge={this.onSwapEdge}
                        onDeleteEdge={this.onDeleteEdge}
                    />
                </div>
                <button style={{zIndex: 9999}} onClick={() => this.runTaskBulk()}>
                    RUN ALL
                </button>
                {selected && (
                    <div style={{display: "flex", flexDirection: "column", marginBottom: 50, alignItems: "center"}}>
                        <div style={{width: "50%"}}>
                            <button style={{zIndex: 9999}} onClick={() => this.runTask()}>
                                RUN
                            </button>
                            <div><h4>Update a node</h4>
                                <span>Task: </span>
                                <input
                                    type="text"
                                    value={selected.task}
                                    onChange={this.updateSelectedTaskType}
                                />
                                {/*<select*/}
                                {/*    value={selected.type}*/}
                                {/*    onChange={this.updateSelectedTaskType}*/}
                                {/*>*/}
                                {/*    <option value={SORT}>Sort</option>*/}
                                {/*</select>*/}
                            </div>
                            <div>
                                <span>Input: </span>
                                <input
                                    type="text"
                                    value={selected.input}
                                    onChange={this.updateSelectedInput}
                                />

                            </div>

                            <div>
                                <span>Output: </span>
                                <input
                                    type="text"
                                    value={selected.output}
                                    onChange={this.updateSelectedOutput}
                                />

                            </div>

                            <div>
                                <span>Data Type: </span>
                                <select
                                    value={selected.dataType}
                                    onChange={this.updateSelectedDataType}
                                >
                                    <option value={DATA_TYPES.INTEGER}>INTEGER</option>
                                </select>

                            </div>


                            <div>
                                <span>Input Source: </span>

                                <select
                                    value={selected.inputSource}
                                    onChange={this.updateSelectedInputSource}
                                >
                                    <option value={FILE}>File</option>
                                    <option value={NODE}>Node</option>
                                </select>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        );
    }
}

function UUID() {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
        c
    ) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
    return uuid;
}
