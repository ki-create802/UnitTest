const fs = require('fs').promises;
//import * as path from 'path';

async function parseJavaFile(filePath, targetMethod = null) {
    const content = await fs.readFile(filePath, 'utf8');
    
    // 类签名提取
    const classMatch = content.match(/public\s+class\s+(\w+)/);
    if (!classMatch) throw new Error('未找到public类定义');

    // 2. 提取成员变量
    const memberVariableRegex = /(public|private|protected|static|final|transient|volatile)\s+([\w<>]+)\s+(\w+)\s*(=\s*[^;]+)?\s*;/g;
    const memberVariables = [];
    let memberMatch;
    while ((memberMatch = memberVariableRegex.exec(content)) !== null) {
        const line = memberMatch[0];
        if (!line.includes('(') && !line.includes(')')) {
            memberVariables.push(line.trim());
        }
    }
    
    // 方法提取逻辑
    let methodCode = '';
    if (targetMethod) {
        const methodName = targetMethod.split('(')[0].trim();
        const methodRegex = new RegExp(
            `(public|protected|private|static)\\s+[\\w<>]+\\s+${methodName}\\s*\\([^)]*\\)[^{]*\\{([^}]*|\\{[^}]*\\})*\\}`,
            'gs'
        );
        
        const match = methodRegex.exec(content);
        methodCode = match ? match[0] : `// 未找到方法: ${targetMethod}`;
    }

    return `// 类名: ${classMatch[1]}\n` +
           `// 文件路径: ${filePath}\n\n` +
           `// 成员变量:\n${memberVariables.map(v => `// ${v}`).join('\n')}\n\n` +
           `${methodCode || '// 未指定具体方法'}`;
}

module.exports = {
    parseJavaFile
};