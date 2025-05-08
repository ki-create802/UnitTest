const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * 编译 Java 文件
 * @param {string} filePath
 * @returns {Promise<{success: boolean, error?: string}>}
 */
function compileJavaFile(filePath) {
    return new Promise((resolve) => {
        exec(`javac "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, error: stderr });
            } else {
                resolve({ success: true });
            }
        });
    });
}

/**
 * 运行 Java 文件（需已编译）
 * @param {string} filePath
 * @returns {Promise<{success: boolean, error?: string}>}
 */
function runJavaFile(filePath) {
    const className = path.basename(filePath, '.java');
    const dirName = path.dirname(filePath);
    return new Promise((resolve) => {
        exec(`java ${className}`, { cwd: dirName }, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, error: stderr });
            } else {
                resolve({ success: true });
            }
        });
    });
}

/**
 * 编译并运行目录下所有 Java 测试文件，失败的会删除
 * @param {string} testFilesDir
 */
async function processGeneratedTestFiles(testFilesDir) {
    try {
        const files = fs.readdirSync(testFilesDir);
        for (const file of files) {
            if (path.extname(file) === '.java') {
                const filePath = path.join(testFilesDir, file);
                const compileResult = await compileJavaFile(filePath);
                if (compileResult.success) {
                    const runResult = await runJavaFile(filePath);
                    if (runResult.success) {
                        console.log(`${file} 运行成功`);
                    } else {
                        console.error(`${file} 运行失败: ${runResult.error}`);
                    }
                } else {
                    console.error(`${file} 编译失败: ${compileResult.error}`);
                    fs.unlinkSync(filePath);
                }
            }
        }
    } catch (err) {
        console.error('🚨 处理测试文件时出错:', err);
    }
}

module.exports = {
    processGeneratedTestFiles
};