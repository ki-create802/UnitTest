// 替换后的 pyGenerator.js，使用 JS 版本的 GetContext.js 和 pathanalysis.js
const { deepseek } = require('./chatAI.js');
const { getConfiguration } = require('./utils.js');
const path = require('path');
const fs = require('fs');

// 引入 JS 版本的 GetContext 和 pathanalysis
const { extractContext, formatContext } = require('./GetContext.js');
const analyzePaths = require('./pathanalysis.js'); // 修改 pathanalysis.js 以支持模块调用

function getAIInfo() {
  return {
    ai: 'DeepSeek Chat',
    apikey: '这里需填写你的apikey',
    // jar包: '相关配置',
    // 语言: 'Python',
    方法名: 'symprompt'
  };
}

async function generatePythonTest(pythonFilePath, selectedText, userQuestion, Back_require) {
  const functionNameMatch = selectedText.match(/def\s+(\w+)\s*\(.*?\)/);
  const targetMethod = functionNameMatch ? functionNameMatch[1] : '未知函数';

  try {
    const config = getConfiguration();

	// 检查文件是否存在
	if (!fs.existsSync(pythonFilePath)) {
		console.error(`文件 ${pythonFilePath} 不存在`);
		return null;
	}

	// 打印调试信息
	console.log(`正在读取的 Python 文件路径: ${pythonFilePath}`);

    // === 获取函数上下文 ===
    const sourceCode = fs.readFileSync(pythonFilePath, 'utf-8');
    console.log(`\n===== JS 获取函数上下文: ${targetMethod} =====`);
    const context = extractContext(sourceCode, targetMethod);
    const contextOutput = formatContext(context);
    console.log(contextOutput);
    console.log(`\n===================================================\n`);

    // === 获取路径分析 ===
    console.log(`\n===== JS 获取执行路径: ${targetMethod} =====`);
    const pathOutput = analyzePaths(sourceCode, targetMethod);
    console.log(pathOutput);
    console.log(`\n===================================================\n`);

    const prompt = `函数上下文:\n${contextOutput}\n测试需要包含的路径:\n${pathOutput}\n你是一个专业的Python语言工程师，请根据以上信息生成规范的、没有编译错误的可运行的Python测试代码，用Markdown代码块格式，不要包含任何代码块标识（如 \`\`\`python 和 \`\`\`）以及其他说明性文字。` + userQuestion;

    // === 打印调试信息：查看完整的 prompt ===
    console.log("\n===== 调试：完整的 prompt 内容 =====");
    console.log(prompt);  // 打印 prompt 内容
    console.log("===================================\n");

    // === 调用大模型生成测试代码 ===
    console.log(`\n===== 生成测试代码中: ${targetMethod} =====`);
    const test = await deepseek(prompt, config.apiKey);

    const importTarget = path.basename(pythonFilePath, '.py');
    const importStatement = `from ${importTarget} import ${targetMethod}\n\n`;
    const finalTestCode = importStatement + test;

    // === 保存测试代码 ===
    const testFileName = `test_${importTarget}.py`;
    const targetDir = path.dirname(pythonFilePath);
    const testFilePath = path.join(targetDir, testFileName);

    fs.writeFileSync(testFilePath, finalTestCode, 'utf-8');
    console.log(`测试文件已成功保存到 ${testFilePath}`);
    console.log(`\n===================================================\n`);

    return [test];

  } catch (error) {
    console.error('发生错误:', error);
    return null;
  }
}

module.exports = {
  generatePythonTest,
  getAIInfo
};
