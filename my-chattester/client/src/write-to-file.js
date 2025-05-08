const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;

/**
 * 将测试用例写入目标目录
 * @param {string} jsonStr - 包含测试用例的JSON字符串
 * @param {string} targetMethod - 目标方法名
 * @param {string} sourceFilePath - 原始Java文件路径
 * @returns {Promise<vscode.Uri[]>} 生成的测试文件URI数组
 */

async function writeTestFiles(jsonStr, targetMethod, sourceFilePath) {
    try {
        
        // 1. 清理和解析JSON
        const cleanedJson = jsonStr.replace(/```json|```/g, '').trim();
        const { tests = [] } = JSON.parse(cleanedJson);

        // 2. 确定输出目录 
        //const testDir = path.join(path.dirname(sourceFilePath), 'generated_tests');
        const testDir = path.dirname(sourceFilePath);
        await fs.mkdir(testDir, { recursive: true });

        // 3. 生成测试文件
        const createdFiles = [];
        for (let i = 0; i < tests.length; i++) {
            const content = tests[i];
            const fileName = `${targetMethod}_Test${i + 1}.java`;
            const filePath = path.join(testDir, fileName);
            
            await fs.writeFile(filePath, content, 'utf8');
            const fileUri = vscode.Uri.file(filePath);
            createdFiles.push(fileUri);
        }

        // 4. 返回结果
        vscode.window.showInformationMessage(
            `已生成 ${tests.length} 个测试文件，编译运行中……`
        );
        return createdFiles;

    } catch (error) {
        vscode.window.showErrorMessage(`测试文件生成失败: ${error.message}`);
        throw error;
    }
}

module.exports = {
    writeTestFiles
};