// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { generateTest } = require('./javaGenerator');
const { generatePythonTest } = require('./pyGenerator');
const { getAIInfo }=require('./javaGenerator')

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

console.log('🔧 Extension loaded');


/**
 * @param {vscode.ExtensionContext} context
 */

let configPanel = null; // 在文件顶部定义一个全局变量来保存配置面板
let chatPanel = null; // 在文件顶部定义一个全局变量来保存 WebviewPanel
let Back_require=null;   //后端需要的json数据
// let chatHtmlCache = ''; // 缓存chat页面内容

//配置面板需要 context 来保存/读取配置（持久化需求）
async function showConfigWebview(context) {
    
    // if (configPanel) {
    //     configPanel.reveal(vscode.ViewColumn.Two);
    //     return configPanel;
    // }
    // 如果面板不存在
    if (!configPanel) 
    {
        // 创建新面板并固定在右侧
        configPanel = vscode.window.createWebviewPanel(
            'configPanel',
            '配置大模型信息',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        const fields = Object.keys(getAIInfo()); // 获取字段列表
        // .get('aiConfig') 尝试读取键为 'aiConfig' 的值。
        // 如果之前调用过 context.globalState.update('aiConfig', {...}) 保存过数据，这里会返回保存的对象；否则返回 undefined。
        const savedConfig = context.globalState.get('aiConfig') || {};

        configPanel.webview.html = getConfigHtml(savedConfig, fields);

        configPanel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'saveConfig') {
                await context.globalState.update('aiConfig', message.data);
                vscode.window.showInformationMessage('配置已保存');
            } else if (message.command === 'gotoChat') {
                // configPanel.hide();
                // const chat = showChatWebview();
                // chat.reveal(vscode.ViewColumn.Two);
                // configPanel.dispose();
                // await showChatWebview();
                if (chatPanel) {
                    chatPanel.reveal(vscode.ViewColumn.Two);
                } else {
                    // showChatWebview(context).reveal(vscode.ViewColumn.Two);
                    const chat = showChatWebview();
                    chat.reveal(vscode.ViewColumn.Two);
                }
            }
        });

        // 面板关闭时清理引用
        configPanel.onDidDispose(() => {
            configPanel = null;
        });
    }
    configPanel.reveal(vscode.ViewColumn.Two);
    return configPanel;

 

    


}

const showChatWebview = () => {
    // if (configPanel) {
    //     configPanel.dispose();
    // }
    // if (chatPanel) {
    //     chatPanel.reveal(vscode.ViewColumn.Two);
    //     return chatPanel;
    // }
    if (!chatPanel) 
    {
        // 创建新面板并固定在右侧
        chatPanel = vscode.window.createWebviewPanel(
            'unitTestChat',
            '单元测试问答助手',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true //保持面板状态
            }
        );

        chatPanel.webview.html = getWebviewContent();
        // chatPanel.webview.html = chatHtmlCache || getWebviewContent();

        //面板关闭时清理引用
        chatPanel.onDidDispose(() => {
            chatPanel = null;
        });
    }
    chatPanel.reveal(vscode.ViewColumn.Two);
    return chatPanel;
};


function activate(context) {

	//TODO：前端写一个界面让用户选择用哪种方法

	let a=getAIInfo();  //获取后端给的json数据（后端需要的项目及解释）

    
    

	//a={
	// 	"ai": "使用的AI模型",  
	// 	"apikey": "这里需填写你的apikey",  
	// 	"jar包": "配置信息"  
	//   }

	//根据后端给的json数据，写前端的配置界面。然后根据用户填写的内容返回一个如下的json数据

	//a={
	// 	"ai": "DeepSeek",  
	// 	"apikey": "1234567",  
	// 	"jar包": "hwkdgquegdo"  
	//   }




    console.log('Congratulations, your extension "my-chattester" is now active!');

    const config = context.globalState.get('aiConfig');
    if (!config) {
        vscode.window.showInformationMessage("首次使用，请先进行配置。");
        showConfigWebview(context);
        
    }
    
    const disposables = [
        // Java测试命令
        vscode.commands.registerCommand('my-chattester.runJavaTest', async () => {
            // await handleTestGeneration(context, generateTest, Back_require);
            const config = context.globalState.get('aiConfig');
            if (!config) {
                vscode.window.showWarningMessage('尚未配置，请先配置大模型参数');
                await showConfigWebview(context);
                return;
            }
            Back_require = config;
            await handleTestGeneration(context, generateTest, Back_require);
        }),
        
        // Python测试命令
        vscode.commands.registerCommand('my-chattester.runPythonTest', async () => {
            // await handleTestGeneration(context,  generatePythonTest,Back_require);
            const config = context.globalState.get('aiConfig');
            if (!config) {
                vscode.window.showWarningMessage('尚未配置，请先配置大模型参数');
                await showConfigWebview(context);
                return;
            }
            Back_require = config;
            await handleTestGeneration(context, generatePythonTest, Back_require);
        }),

        // 进入配置界面
        vscode.commands.registerCommand('my-chattester.configure', async () => {
            await showConfigWebview(context);
        })
    ];
    
    // 批量注册
    disposables.forEach(d => context.subscriptions.push(d));
}

// 统一测试命令处理函数
async function handleTestGeneration(context, generatorFunction,Back_require) {
    // 显示命令已触发
    vscode.window.showInformationMessage(`测试生成命令已触发！`);
    
    // 检查是否有活跃的编辑器且当前文件是目标语言文件
    const editor = vscode.window.activeTextEditor;
    if (!editor ) {
        vscode.window.showErrorMessage(`请打开文件`);
        return;
    }

    // 获取选中的代码
    const selection = editor.selection;
    const selectedText = editor.document.getText(selection).trim();
    if (!selectedText) {
        vscode.window.showErrorMessage(`请先选中一个方法/函数代码段`);
        return;
    }


    // 显示进度通知
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `正在生成测试...`,
        cancellable: true
    }, async (progress, token) => {
        // 取消操作监听
        token.onCancellationRequested(() => {
            vscode.window.showInformationMessage('用户取消了操作');
        });

        try {
            let userQuestion = "";
            const modelReply = await generatorFunction(editor.document.uri.fsPath, selectedText, userQuestion, Back_require);
            vscode.window.showInformationMessage(`成功生成测试用例！`);

            const panel = showChatWebview();
            panel.webview.html = getWebviewContent();

            panel.webview.onDidReceiveMessage(async (message) => {
                if (message.command === 'askModel') {
                    const userQuestion = message.text;
                    const modelReply = await generatorFunction(editor.document.uri.fsPath, selectedText, userQuestion,Back_require);
                    
                    const formattedResponse = modelReply.map((test, index) => {
                            return `### 测试用例 ${index + 1}\n\n\`\`\`\n${test}\n\`\`\``;
                        }).join('\n\n---\n\n')

                    
                    panel.webview.postMessage({ 
                        command: 'reply', 
                        text: `已为您生成以下单元测试：\n\n${formattedResponse}`
                    });
                }else if (message.command === 'gotoConfig') {
                    // await showConfigWebview(context);
                    if (configPanel) {
                        configPanel.reveal(vscode.ViewColumn.Two);
                    } else {
                        await showConfigWebview(context);
                    }
                    // panel.hide();
                    // // panel.dispose();
                    // // await showConfigWebview(context);
                    // const config = await showConfigWebview(context);
                    // config.reveal(vscode.ViewColumn.Two);
                }
            });

            // 初始显示生成的测试用例
            const formattedTests = modelReply.map((test, index) => {
                    return `### 测试用例 ${index + 1}\n\n\`\`\`\n${test}\n\`\`\``;
                }).join('\n\n---\n\n')

            panel.webview.postMessage({
                command: 'reply',
                text: `已为您生成以下单元测试：\n\n${formattedTests}`
            });

            // 在 activate() 函数中添加文件打开监听
            context.subscriptions.push(
                vscode.workspace.onDidOpenTextDocument((doc) => {
                    if (panel && vscode.window.activeTextEditor?.viewColumn === vscode.ViewColumn.Beside) {
                        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                        vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One });
                    }
                })
            );

            context.subscriptions.push(
                vscode.commands.registerCommand('my-chattester.configureModel', () => {
                    showConfigWebview(context);
                })
            );

        } catch (error) {
            vscode.window.showErrorMessage(`生成测试失败: ${error.message}`);
        }
    });
}



function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="zh">
<head>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/default.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: sans-serif;
            margin: 10px;
        }
        #chat {
            height: 400px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 10px;
            background: #f9f9f9;
        }
        .msg {
            margin-bottom: 8px;
            padding: 8px 12px;
            border-radius: 12px;
            max-width: 80%;
            clear: both;
        }
        .user {
            background-color: #dcf8c6;
            float: right;
            text-align: right;
        }
        .model {
            background-color: #e6e6e6;
            float: left;
            text-align: left;
        }
        #input {
            width: 80%;
            padding: 6px;
            font-size: 14px;
        }
        button {
            padding: 6px 12px;
            font-size: 14px;
            margin-left: 4px;
        }
        #loading {
            margin-bottom: 10px;
        }
        /* 代码块容器样式 */
        .code-container {
            position: relative;
            margin: 10px 0;
        }
        /* 复制按钮样式 */
        .copy-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            padding: 3px 8px;
            font-size: 12px;
            background: #0078d4;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.3s;
        }
        .copy-btn:hover {
            opacity: 1;
        }
        /* 复制成功提示 */
        .copy-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px;
            background: #4CAF50;
            color: white;
            border-radius: 4px;
            display: none;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="loading" style="display:none; color: gray; font-style: italic;">生成中...</div>
    <div id="chat"></div>
    <div id="copy-notification" class="copy-notification">已复制到剪贴板</div>
    <input type="text" id="input" placeholder="输入你的问题...">
    <button onclick="send()">发送</button>
    <button onclick="gotoConfig()">修改配置</button>
    <script>
        const vscode = acquireVsCodeApi();
        const chat = document.getElementById('chat');
        const copyNotification = document.getElementById('copy-notification');
        
        // 添加复制功能
        function addCopyButtons() {
            document.querySelectorAll('pre code').forEach((codeBlock) => {
                const container = document.createElement('div');
                container.className = 'code-container';
                
                // 包裹代码块
                codeBlock.parentNode.replaceChild(container, codeBlock);
                container.appendChild(codeBlock);
                
                // 添加复制按钮
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-btn';
                copyButton.textContent = '复制';
                copyButton.addEventListener('click', () => {
                    const code = codeBlock.textContent;
                    navigator.clipboard.writeText(code).then(() => {
                        // 显示复制成功提示
                        copyNotification.style.display = 'block';
                        setTimeout(() => {
                            copyNotification.style.display = 'none';
                        }, 2000);
                    }).catch(err => {
                        console.error('复制失败:', err);
                    });
                });
                container.appendChild(copyButton);
            });
        }
        
        function appendMessage(role, text) {
            const div = document.createElement('div');
            div.className = 'msg ' + role;
            if (role === 'user') {
                div.textContent = '🧑‍💻你: ' + text;
            } else {
                div.innerHTML = '<strong>🤖助手:</strong><br>' + marked.parse(text);
                setTimeout(() => {
                    hljs.highlightAll();
                    addCopyButtons(); // 添加复制按钮
                }, 0);
            }
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }
        
        function send() {
            const input = document.getElementById('input');
            const text = input.value.trim();
            if (!text) return;
            appendMessage('user', text);
            document.getElementById('loading').style.display = 'block';
			console.log("发出信息");
			console.log(text);
            vscode.postMessage({ command: 'askModel', text });
            // vscode.postMessage({ command: 'saveState', state: document.getElementById('chat').innerHTML });
            input.value = '';
        }

        //  跳转到配置界面  
        function gotoConfig() {
            vscode.postMessage({ command: 'gotoConfig' });
        }
        
        window.addEventListener('message', event => {
            // const message = event.data;
			// console.log("收到回复消息：", message);  // 添加这行
            // if (message.command === 'reply') {
            //     appendMessage('model', message.text);                       
            //     document.getElementById('loading').style.display = 'none';
            // }
			try {
				const message = event.data;
				console.log("收到回复消息：", message);  // 添加这行
				if (message.command === 'reply') {
					appendMessage('model', message.text);                       
					document.getElementById('loading').style.display = 'none';
				}
			} catch (error) {
				console.error("处理消息时出错:", error);
			}
        });
    </script>
</body>
</html>`;
}

function getConfigHtml(config,fields) {
    const inputFields = fields.map(key => `
        <div>
            <label>${key}:</label><br>
            <input id="${key}" value="${config[key] || ''}" placeholder="请输入 ${key}" />
        </div>
    `).join('\n');
    return `
    <!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: sans-serif; padding: 20px; }
            input, textarea { width: 75%; margin: 10px 0; padding: 8px; }
            button { padding: 8px 12px; }
        </style>
    </head>
    <body>
        <h2>配置大模型信息</h2>


        ${inputFields}
        <button onclick="save()">保存配置</button>
        <button onclick="gotoChat()">进入问答助手</button>
        <script>
            const vscode = acquireVsCodeApi();
            function save() {
                // const config = {
                //     ai: document.getElementById('ai').value,
                //     apikey: document.getElementById('apikey').value,
                //     'jar包': document.getElementById('jar').value
                // };
                const data = {};
                ${fields.map(key => `data["${key}"] = document.getElementById("${key}").value;`).join('\n')}
                vscode.postMessage({ command: 'saveConfig', data: config });
            }
            function gotoChat() {
                vscode.postMessage({ command: 'gotoChat' });
            }
        </script>
        
    </body>
    </html>`;
}


// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
