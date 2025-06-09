const Parser = require('node-tree-sitter');
const Python = require('tree-sitter-python');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const parser = new Parser();
parser.setLanguage(Python);

function extractContext(sourceCode, functionName) {
    const tree = parser.parse(sourceCode);
    const root = tree.rootNode;

    const context = {
        imports: [],
        globals: [],
        class_definitions: {},
        function_definitions: {},
        target_function: null,
        dependencies: [],
        type_context: {
            function_name: functionName,
            parameters: [],
            return_type: 'Any'
        }
    };

    function extractAnnotation(node) {
        if (!node) return 'Any';
        return sourceCode.slice(node.startIndex, node.endIndex);
    }

    for (const child of root.namedChildren) {
        if (child.type === 'import_statement' || child.type === 'import_from_statement') {
            context.imports.push(sourceCode.slice(child.startIndex, child.endIndex));

        } else if (child.type === 'expression_statement') {
            const expr = child.namedChildren[0];
            if (expr && expr.type === 'assignment') {
                const debugSource = sourceCode.slice(expr.startIndex, expr.endIndex);
                console.log("\n[DEBUG] 🔍 分析 assignment 节点源码:\n" + debugSource);

                const named = expr.namedChildren;
                console.log(`[DEBUG] 🧩 namedChildren 长度: ${named.length}`);
                named.forEach((n, i) => {
                    console.log(`[DEBUG]   ➤ 第 ${i + 1} 个子节点类型: ${n.type}, 文本: ${sourceCode.slice(n.startIndex, n.endIndex)}`);
                });

                // 简单单变量赋值
                if (named.length === 2 && named[0].type === 'identifier') {
                    const name = named[0].text;
                    const value = sourceCode.slice(named[1].startIndex, named[1].endIndex);
                    console.log(`[DEBUG] ✅ 添加全局变量: ${name} = ${value}`);
                    context.globals.push({ name, value });
                }

                // 多变量赋值
                else if (named.length === 2 && named[0].type === 'expression_list') {
                    const leftList = named[0].namedChildren;
                    const rightList = named[1].namedChildren;
                    for (let i = 0; i < leftList.length; i++) {
                        const left = leftList[i];
                        const right = rightList[i];
                        if (left.type === 'identifier') {
                            const name = left.text;
                            const value = right ? sourceCode.slice(right.startIndex, right.endIndex) : 'undefined';
                            console.log(`[DEBUG] ✅ 添加多变量: ${name} = ${value}`);
                            context.globals.push({ name, value });
                        }
                    }
                } else {
                    console.warn(`[DEBUG] ⚠️ 未处理的 assignment 结构，跳过：${debugSource}`);
                }
            }
        }


        else if (child.type === 'class_definition') {
            const className = child.childForFieldName('name').text;
            const methods = {};
            for (const item of child.namedChildren) {
                if (item.type === 'function_definition') {
                    const methodName = item.childForFieldName('name').text;
                    methods[methodName] = sourceCode.slice(item.startIndex, item.endIndex);
                }
            }
            context.class_definitions[className] = {
                signature: sourceCode.slice(child.startIndex, child.endIndex),
                methods
            };
        } else if (child.type === 'function_definition') {
            const funcName = child.childForFieldName('name').text;
            const funcCode = sourceCode.slice(child.startIndex, child.endIndex);
            context.function_definitions[funcName] = funcCode;

            if (funcName === functionName) {
                context.target_function = child;

                const params = child.childForFieldName('parameters');
                for (const param of params.namedChildren) {
                    if (param.type === 'identifier') {
                        context.type_context.parameters.push({
                            name: param.text,
                            type: 'Any'
                        });
                    } else if (param.type === 'default_parameter') {
                        const nameNode = param.child(0);
                        const name = nameNode ? nameNode.text : '[未知参数]';
                        const annotation = nameNode && nameNode.namedChildren.length > 1
                            ? nameNode.namedChildren[1]
                            : null;
                        context.type_context.parameters.push({
                            name,
                            type: extractAnnotation(annotation)
                        });
                    } else if (param.type === 'typed_parameter') {
                        const nameNode = param.childForFieldName('name');
                        const annotation = param.childForFieldName('type');
                        const name = nameNode ? nameNode.text : '[未知参数]';
                        context.type_context.parameters.push({
                            name,
                            type: extractAnnotation(annotation)
                        });
                    } else {
                        context.type_context.parameters.push({
                            name: '[未知参数]',
                            type: 'Any'
                        });
                    }
                }

                const returnTypeNode = child.childForFieldName('return_type');
                if (returnTypeNode) {
                    context.type_context.return_type = extractAnnotation(returnTypeNode);
                }

                const calls = child.descendantsOfType('call');
                for (const call of calls) {
                    const funcNode = call.child(0);
                    if (funcNode) {
                        context.dependencies.push(funcNode.text);
                    }
                }
            }
        }
    }

    return context;
}

function formatContext(context) {
    const output = [];

    const typeCtx = context.type_context;
    output.push("=== 函数基本信息 ===");
    output.push(`函数名称: ${typeCtx.function_name}`);
    output.push(`返回类型: ${typeCtx.return_type}`);
    output.push("\n参数列表:");
    for (const param of typeCtx.parameters) {
        output.push(`- ${param.name}: ${param.type}`);
    }

    output.push("\n=== 依赖信息 ===");
    output.push("\n导入语句:");
    for (const i of context.imports) {
        output.push(`- ${i}`);
    }

    output.push("\n全局变量:");
    for (const g of context.globals) {
        output.push(`- ${g.name}: ${g.value}`);
    }

    output.push("\n依赖的函数/方法:");
    for (const d of context.dependencies) {
        output.push(`- ${d}`);
    }

    output.push("\n=== 相关定义 ===");
    output.push("\n其他类定义:");
    for (const [name, cls] of Object.entries(context.class_definitions)) {
        output.push(`\n类 ${name}:\n${cls.signature}`);
    }

    output.push("\n其他函数定义:");
    for (const [name, def] of Object.entries(context.function_definitions)) {
        if (name !== typeCtx.function_name) {
            output.push(`\n函数 ${name}:\n${def}`);
        }
    }

    output.push("\n=== 完整函数定义 ===");
    output.push(context.function_definitions[typeCtx.function_name] || "未找到目标函数");

    return output.join('\n');
}

// function runFunctionIOTest(context) {
//     if (!context.function_definitions[context.type_context.function_name]) {
//         console.log("\n🚫 未找到目标函数，无法执行测试。");
//         return;
//     }

//     console.log("\n=== 🧪 输入输出示例测试 ===");

//     const testCases = [
//         [12, true, "yes"],
//         [12, false, "yes"],
//         [12, false, "no"],
//         [7, true, "yes"],
//         [3, false, "no"]
//     ];

//     const funcCode = context.function_definitions[context.type_context.function_name];
//     const runnerPath = path.join(__dirname, 'temp_run.py');
//     const runnerCode = `
// ${funcCode}

// import sys
// import json

// if __name__ == "__main__":
//     args = json.loads(sys.argv[1])
//     print(${context.type_context.function_name}(*args))
// `;

//     fs.writeFileSync(runnerPath, runnerCode, 'utf-8');

//     for (const args of testCases) {
//         const input = JSON.stringify(args);
//         const result = spawnSync('python', [runnerPath, input], {
//             encoding: 'utf-8'
//         });

//         const output = result.stdout.trim();
//         console.log(`输入 ${JSON.stringify(args)} => 输出: ${output}`);
//     }

//     fs.unlinkSync(runnerPath);
// }

// === CLI 执行部分 ===
if (require.main === module) {
    const [,, filePath, functionName] = process.argv;

    if (!filePath || !functionName) {
        console.log("用法: node GetContext.js <python_file_path> <target_function>");
        process.exit(1);
    }

    const code = fs.readFileSync(filePath, 'utf-8');
    const context = extractContext(code, functionName);
    const output = formatContext(context);
    console.log(output);

    // runFunctionIOTest(context);
}

module.exports = {
    extractContext,
    formatContext
};