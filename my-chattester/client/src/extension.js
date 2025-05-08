// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { generateTest } = require('./javaGenerator');
const { generatePythonTest } = require('./pyGenerator');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

console.log('🔧 Extension loaded');


/**
 * @param {vscode.ExtensionContext} context
 */

let chatPanel = null; // 在文件顶部定义一个全局变量来保存 WebviewPanel

function activate(context) {
	
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "my-chattester" is now active!');
	const createChatPanel = () => {
        if (chatPanel) {
            // 如果面板已存在，直接显示并返回
            chatPanel.reveal(vscode.ViewColumn.Two);
            return chatPanel;
        }

        // 创建新面板并固定在右侧
        chatPanel = vscode.window.createWebviewPanel(
            'unitTestChat',
            '单元测试问答助手',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true // ✅ 保持面板状态
            }
        );

        // 面板关闭时清理引用
        chatPanel.onDidDispose(() => {
            chatPanel = null;
        });

        return chatPanel;
    };

	const disposables = [
		//java测试命令
        vscode.commands.registerCommand('my-chattester.runJavaTest', async () => {
			// The code you place here will be executed every time your command is executed
			vscode.window.showInformationMessage('Java测试生成命令已触发！');
			//检查是否有活跃的文本编辑器 (activeTextEditor)以及当前文件是否为 Java 文件 
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document.languageId !== 'java') {
				vscode.window.showErrorMessage('请打开Java文件');
				return;
			}
	
			// 获取选中的代码
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection).trim();
			if (!selectedText) {
				vscode.window.showErrorMessage('请先选中一个 Java 方法代码段');
				return;
			}

			
			//进度反馈与任务执行
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				//title: `正在为 ${methodSignature} 生成测试...`,
				title: `正在为生成测试...`,
				cancellable: true
			}, async (progress, token) => {
				// 取消操作监听
				token.onCancellationRequested(() => {
					vscode.window.showInformationMessage('用户取消了操作');
				});
	
				try {
					let userQuestion="";
					const modelReply=await generateTest(editor.document.uri.fsPath, selectedText,userQuestion);  //
					
					
					// 模型生成完毕后打开 Webview 聊天面板
					// const panel = vscode.window.createWebviewPanel(
					// 	'unitTestChat',
					// 	'单元测试问答助手',
					// 	vscode.ViewColumn.Two,
					// 	{ enableScripts: true }
					// );
					const panel = createChatPanel();


					panel.webview.html = getWebviewContent();

					panel.webview.onDidReceiveMessage(async (message) => {
						console.log("收到消息：", message);
						if (message.command === 'askModel') {
							const userQuestion = message.text;
							const modelReply = await generateTest(editor.document.uri.fsPath, selectedText,userQuestion);
							console.log("💬 模型回复内容：", modelReply); // 加上这一行
							//panel.webview.postMessage({ command: 'reply', text: modelReply });  //原来

							//修改
							//将测试用例数组转换为 Markdown 格式的字符串
							// const tests=[
							// 	"import static org.junit.jupiter.api.Assertions.assertEquals;\nimport org.junit.jupiter.api.Test;\n\npublic class add_test1_Test {\n\n    @Test\n    public void testAddPositiveNumbers() {\n        double result = Calculator.add(5.5, 4.5);\n        assertEquals(10.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddNegativeNumbers() {\n        double result = Calculator.add(-3.2, -1.8);\n        assertEquals(-5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddMixedNumbers() {\n        double result = Calculator.add(7.3, -2.3);\n        assertEquals(5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddZero() {\n        double result = Calculator.add(0.0, 0.0);\n        assertEquals(0.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddLargeNumbers() {\n        double result = Calculator.add(1.0E10, 2.0E10);\n        assertEquals(3.0E10, result, 0.0001);\n    }\n}",
							// 	"import static org.junit.jupiter.api.Assertions.assertEquals;\nimport org.junit.jupiter.api.Test;\n\npublic class add_test2_Test {\n\n    @Test\n    public void testAddDecimalNumbers() {\n        double result = Calculator.add(0.1, 0.2);\n        assertEquals(0.3, result, 0.0001);\n    }\n\n    @Test\n    public void testAddWithZero() {\n        double result = Calculator.add(5.0, 0.0);\n        assertEquals(5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddSameNumbers() {\n        double result = Calculator.add(3.14, 3.14);\n        assertEquals(6.28, result, 0.0001);\n    }\n\n    @Test\n    public void testAddSmallNumbers() {\n        double result = Calculator.add(0.0001, 0.0002);\n        assertEquals(0.0003, result, 0.0001);\n    }\n\n    @Test\n    public void testAddMaxValues() {\n        double result = Calculator.add(Double.MAX_VALUE, Double.MAX_VALUE);\n        assertEquals(Double.POSITIVE_INFINITY, result, 0.0001);\n    }\n}"
							// ];
							
							const formattedResponse = modelReply.map((test, index) => {
								return `### 测试用例 ${index + 1}\n\n\`\`\`\n${test}\n\`\`\``;
							}).join('\n\n---\n\n');
							
							panel.webview.postMessage({ 
								command: 'reply', 
								text: `已为您生成以下单元测试：\n\n${formattedResponse}`
							});

							console.log("💬 模型回复内容2：", formattedResponse); // 加上这一行

						}
					});
		
					// panel.webview.postMessage({   //原来
					//     command: 'reply',
					//     text: modelResponse
					// });

					//修改
					// 初始显示生成的测试用例
					// const tests=[
					// 	"import static org.junit.jupiter.api.Assertions.assertEquals;\nimport org.junit.jupiter.api.Test;\n\npublic class add_test1_Test {\n\n    @Test\n    public void testAddPositiveNumbers() {\n        double result = Calculator.add(5.5, 4.5);\n        assertEquals(10.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddNegativeNumbers() {\n        double result = Calculator.add(-3.2, -1.8);\n        assertEquals(-5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddMixedNumbers() {\n        double result = Calculator.add(7.3, -2.3);\n        assertEquals(5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddZero() {\n        double result = Calculator.add(0.0, 0.0);\n        assertEquals(0.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddLargeNumbers() {\n        double result = Calculator.add(1.0E10, 2.0E10);\n        assertEquals(3.0E10, result, 0.0001);\n    }\n}",
					// 	"import static org.junit.jupiter.api.Assertions.assertEquals;\nimport org.junit.jupiter.api.Test;\n\npublic class add_test2_Test {\n\n    @Test\n    public void testAddDecimalNumbers() {\n        double result = Calculator.add(0.1, 0.2);\n        assertEquals(0.3, result, 0.0001);\n    }\n\n    @Test\n    public void testAddWithZero() {\n        double result = Calculator.add(5.0, 0.0);\n        assertEquals(5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddSameNumbers() {\n        double result = Calculator.add(3.14, 3.14);\n        assertEquals(6.28, result, 0.0001);\n    }\n\n    @Test\n    public void testAddSmallNumbers() {\n        double result = Calculator.add(0.0001, 0.0002);\n        assertEquals(0.0003, result, 0.0001);\n    }\n\n    @Test\n    public void testAddMaxValues() {\n        double result = Calculator.add(Double.MAX_VALUE, Double.MAX_VALUE);\n        assertEquals(Double.POSITIVE_INFINITY, result, 0.0001);\n    }\n}"
					// ];
					console.log("modelreply\n");
					console.log(modelReply);
					// const cleanedJson = modelReply.replace(/```json|```/g, '').trim();
					// console.log(cleanedJson);
        			// const { tests = [] } = JSON.parse(cleanedJson);
					// console.log(tests);

					const formattedTests = modelReply.map((test, index) => {
						return `### 测试用例 ${index + 1}\n\n\`\`\`\n${test}\n\`\`\``;
					}).join('\n\n---\n\n');

					panel.webview.postMessage({
						command: 'reply',
						text: `已为您生成以下单元测试：\n\n${formattedTests}`
					});

					// 在 activate() 函数中添加文件打开监听
					context.subscriptions.push(
						vscode.workspace.onDidOpenTextDocument((doc) => {
							// 如果右侧有我们的聊天面板，且用户尝试在右侧打开文件
							if (panel && vscode.window.activeTextEditor?.viewColumn === vscode.ViewColumn.Beside) {
								// 关闭当前文件（在右侧打开的）
								vscode.commands.executeCommand('workbench.action.closeActiveEditor');
								// 重新在左侧打开
								vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One });
							}
						})
					);
    

				} catch (error) {
					vscode.window.showErrorMessage(`生成失败: ${error.message}`);
				}
			});
			
		}),

		//python测试命令
        vscode.commands.registerCommand('my-chattester.runPythonTest', async () => {
			// 显示命令已触发
			vscode.window.showInformationMessage('Python测试生成命令已触发！');
			
			// 检查是否有活跃的编辑器且当前文件是Python文件
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document.languageId !== 'python') {
				vscode.window.showErrorMessage('请打开Python文件');
				return;
			}
	
			// 获取选中的代码
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection).trim();
			if (!selectedText) {
				vscode.window.showErrorMessage('请先选中一个Python函数或方法代码段');
				return;
			}
	
	
			// 显示进度通知
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `正在为函数生成Python测试...`,
				cancellable: true
			}, async (progress, token) => {
				// 取消操作监听
				token.onCancellationRequested(() => {
					vscode.window.showInformationMessage('用户取消了操作');
				});
	
				try {
					let userQuestion="";
					// 调用生成Python测试的函数
					const modelReply =await generatePythonTest(editor.document.uri.fsPath, selectedText,userQuestion);
					vscode.window.showInformationMessage(`成功 生成测试用例！`);

					//修改
					// 模型生成完毕后打开 Webview 聊天面板
					// const panel = vscode.window.createWebviewPanel(
					// 	'unitTestChat',
					// 	'单元测试问答助手',
					// 	vscode.ViewColumn.Two,
					// 	{ enableScripts: true }
					// );

					const panel = createChatPanel();

					panel.webview.html = getWebviewContent();

					panel.webview.onDidReceiveMessage(async (message) => {
						if (message.command === 'askModel') {
							const userQuestion = message.text;
							const modelReply = await generatePythonTest(editor.document.uri.fsPath, selectedText,userQuestion);
							console.log("💬 模型回复内容：", modelReply); // 加上这一行
							//panel.webview.postMessage({ command: 'reply', text: modelReply });  //原来

							//修改
							// 将测试用例数组转换为 Markdown 格式的字符串
							// const tests=[
							// 	"import static org.junit.jupiter.api.Assertions.assertEquals;\nimport org.junit.jupiter.api.Test;\n\npublic class add_test1_Test {\n\n    @Test\n    public void testAddPositiveNumbers() {\n        double result = Calculator.add(5.5, 4.5);\n        assertEquals(10.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddNegativeNumbers() {\n        double result = Calculator.add(-3.2, -1.8);\n        assertEquals(-5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddMixedNumbers() {\n        double result = Calculator.add(7.3, -2.3);\n        assertEquals(5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddZero() {\n        double result = Calculator.add(0.0, 0.0);\n        assertEquals(0.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddLargeNumbers() {\n        double result = Calculator.add(1.0E10, 2.0E10);\n        assertEquals(3.0E10, result, 0.0001);\n    }\n}",
							// 	"import static org.junit.jupiter.api.Assertions.assertEquals;\nimport org.junit.jupiter.api.Test;\n\npublic class add_test2_Test {\n\n    @Test\n    public void testAddDecimalNumbers() {\n        double result = Calculator.add(0.1, 0.2);\n        assertEquals(0.3, result, 0.0001);\n    }\n\n    @Test\n    public void testAddWithZero() {\n        double result = Calculator.add(5.0, 0.0);\n        assertEquals(5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddSameNumbers() {\n        double result = Calculator.add(3.14, 3.14);\n        assertEquals(6.28, result, 0.0001);\n    }\n\n    @Test\n    public void testAddSmallNumbers() {\n        double result = Calculator.add(0.0001, 0.0002);\n        assertEquals(0.0003, result, 0.0001);\n    }\n\n    @Test\n    public void testAddMaxValues() {\n        double result = Calculator.add(Double.MAX_VALUE, Double.MAX_VALUE);\n        assertEquals(Double.POSITIVE_INFINITY, result, 0.0001);\n    }\n}"
							// ];
							

							const formattedResponse = `### 单元测试代码\n\n\`\`\`python\n${modelReply}\n\`\`\``;
							panel.webview.postMessage({ 
								command: 'reply', 
								text: `已为您生成以下单元测试：\n\n${formattedResponse}`
							});
							
						}
					});
		
					// panel.webview.postMessage({   //原来
					//     command: 'reply',
					//     text: modelResponse
					// });

					//修改
					//初始显示生成的测试用例
					const tests=[
						"import static org.junit.jupiter.api.Assertions.assertEquals;\nimport org.junit.jupiter.api.Test;\n\npublic class add_test1_Test {\n\n    @Test\n    public void testAddPositiveNumbers() {\n        double result = Calculator.add(5.5, 4.5);\n        assertEquals(10.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddNegativeNumbers() {\n        double result = Calculator.add(-3.2, -1.8);\n        assertEquals(-5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddMixedNumbers() {\n        double result = Calculator.add(7.3, -2.3);\n        assertEquals(5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddZero() {\n        double result = Calculator.add(0.0, 0.0);\n        assertEquals(0.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddLargeNumbers() {\n        double result = Calculator.add(1.0E10, 2.0E10);\n        assertEquals(3.0E10, result, 0.0001);\n    }\n}",
						"import static org.junit.jupiter.api.Assertions.assertEquals;\nimport org.junit.jupiter.api.Test;\n\npublic class add_test2_Test {\n\n    @Test\n    public void testAddDecimalNumbers() {\n        double result = Calculator.add(0.1, 0.2);\n        assertEquals(0.3, result, 0.0001);\n    }\n\n    @Test\n    public void testAddWithZero() {\n        double result = Calculator.add(5.0, 0.0);\n        assertEquals(5.0, result, 0.0001);\n    }\n\n    @Test\n    public void testAddSameNumbers() {\n        double result = Calculator.add(3.14, 3.14);\n        assertEquals(6.28, result, 0.0001);\n    }\n\n    @Test\n    public void testAddSmallNumbers() {\n        double result = Calculator.add(0.0001, 0.0002);\n        assertEquals(0.0003, result, 0.0001);\n    }\n\n    @Test\n    public void testAddMaxValues() {\n        double result = Calculator.add(Double.MAX_VALUE, Double.MAX_VALUE);\n        assertEquals(Double.POSITIVE_INFINITY, result, 0.0001);\n    }\n}"
					];
					console.log("modelreply\n");
					console.log(modelReply);
					// const cleanedJson = modelReply.replace(/```json|```/g, '').trim();
					// console.log(cleanedJson);
        			// const { tests = [] } = JSON.parse(cleanedJson);
					// console.log(tests);

					
					const formattedResponse = `### 单元测试代码\n\n\`\`\`python\n${tests}\n\`\`\``;
					panel.webview.postMessage({
						command: 'reply',
						text: `已为您生成以下单元测试：\n\n${formattedResponse}`
					});
    

				} catch (error) {
					vscode.window.showErrorMessage(`生成Python测试失败: ${error.message}`);
				}
			});
		})
	];
	
	// 批量注册
	disposables.forEach(d => context.subscriptions.push(d));
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
            input.value = '';
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


// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
