const { execSync } = require ('child_process');
const { deepseek } = require ('./chatAI.js');
const { getConfiguration } = require('./utils.js');
const path = require('path');
const fs = require('fs');


const pluginRoot = __dirname; // 获取当前 JS 文件的目录

async function generatePythonTest(pythonFilePath, selectedText,userQuestion,Back_require) {
    // 提取函数/方法名
	const functionNameMatch = selectedText.match(/def\s+(\w+)\s*\(.*?\)/);
	const targetMethod = functionNameMatch ? functionNameMatch[1] : '未知函数';   //此处原本是functionName
    try {
        // 获取配置
        const config = getConfiguration();

        // 调用 GetContext.py 获取函数上下文
        console.log(`\n===== Getting Function Context: ${targetMethod} =====`);
        const getContextPath = path.join(pluginRoot, 'GetContext.py');
        const contextCommand = `python "${getContextPath}" "${pythonFilePath}" "${targetMethod}"`;     
        const contextOutput = execSync(contextCommand).toString();
        console.log(contextOutput);
        console.log(`\n===================================================\n`);

        // 调用 pathanalysis.py 获取执行的路径
        console.log(`\n===== Getting Execution Paths: ${targetMethod} =====`);
        const getPath = path.join(pluginRoot, 'pathanalysis.py');
        const pathsCommand = `python "${getPath}" "${pythonFilePath}" "${targetMethod}"`;
        const pathsOutput = execSync(pathsCommand).toString();
        console.log(pathsOutput);
        console.log(`\n===================================================\n`);

        // 组合上下文和路径输出作为提示词
        const prompt = `函数上下文:\n${contextOutput}\n测试需要包含的路径:\n${pathsOutput}\n你是一个专业的Python语言工程师，请根据以上信息生成规范的、没有编译错误的可运行的Python测试代码，用Markdown代码块格式，不要包含任何代码块标识（如 \`\`\`python 和 \`\`\`）以及其他说明性文字。`+userQuestion;
        // 调用大模型生成测试代码
        console.log(`\n===== Generating Python Test: ${targetMethod} =====`);
        const test = await deepseek(prompt, config.apiKey);
        console.log(test);
        console.log(`\n===================================================\n`);

        // 将测试代码写入文件
        console.log(`\n===== Generating Python Test File: ${targetMethod} =====`);
        const testFileName = 'python_test_file.py'; // 文件名可以根据需要修改
        const targetDir = path.dirname(pythonFilePath); // 提取 testPython.py 所在目录
        const testFilePath = path.join(targetDir, testFileName); // 构建测试文件路径

        fs.writeFile(testFilePath, test, (err) => {
            if (err) {
                console.error('写入文件时出错:', err);
            } else {
                console.log(`测试文件已成功保存到 ${testFilePath}`);
            }
        });
        console.log(`\n===================================================\n`);

        return [test];

    } catch (error) {
        console.error('发生错误:', error);
        return null;
    }
}

module.exports = {
    generatePythonTest
};