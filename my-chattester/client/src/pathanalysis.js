const Parser = require('node-tree-sitter');
const Python = require('tree-sitter-python');
const fs = require('fs');
const path = require('path');

// 导出分析函数
module.exports = function analyzePaths(sourceCode, targetFunc) {
    const parser = new Parser();
    parser.setLanguage(Python);

    // 解析 AST
    const tree = parser.parse(sourceCode);

    // 查找函数定义节点
    function findFunction(tree, name) {
        const root = tree.rootNode;
        for (let node of root.namedChildren) {
            if (node.type === 'function_definition') {
                const funcName = node.childForFieldName('name').text;
                if (funcName === name) return node;
            }
        }
        return null;
    }

    // 提取 if 路径
    function extractPaths(node, current = [], paths = []) {
        if (!node || !node.namedChildren) return;

        for (const child of node.namedChildren) {
            if (child.type === 'if_statement') {
                const conditionNode = child.childForFieldName('condition');
                const test = sourceCode.slice(conditionNode.startIndex, conditionNode.endIndex);
                
                const consequenceNode = child.childForFieldName('consequence');
                const alternativeNode = child.childForFieldName('alternative');

                // 分支 1：if 为真
                const condTrue = current.concat([test]);
                extractPaths(consequenceNode, condTrue, paths);

                // 分支 2：if 为假（处理 else / elif / 空）
                const condFalse = current.concat([`not (${test})`]);
                if (alternativeNode) {
                    if (alternativeNode.type === 'if_statement') {
                        extractPaths(alternativeNode, condFalse, paths);
                    } else if (alternativeNode.type === 'elif_clause') {
                        const elifCondNode = alternativeNode.childForFieldName('condition');
                        const elifTest = sourceCode.slice(elifCondNode.startIndex, elifCondNode.endIndex);
                        const elifConsequent = alternativeNode.childForFieldName('consequence');
                        const elifAlt = alternativeNode.childForFieldName('alternative');

                        // true: not (...) 且 ...
                        const condTrue2 = condFalse.concat([elifTest]);
                        extractPaths(elifConsequent, condTrue2, paths);

                        // false: not (...) 且 not (...)
                        const condFalse2 = condFalse.concat([`not (${elifTest})`]);
                        if (!elifAlt || elifAlt.namedChildren.length === 0) {
                            const finalPath = condFalse2.join(' 且 ');
                            if (!paths.includes(finalPath)) {
                                paths.push(finalPath);
                            }
                        } else {
                            extractPaths(elifAlt, condFalse2, paths);
                        }
                    } else {
                        extractPaths(alternativeNode, condFalse, paths);
                    }
                } else {
                    const desc = condFalse.join(' 且 ');
                    if (!paths.includes(desc)) {
                        paths.push(desc);
                    }
                }

            } else if (child.type === 'return_statement' || child.type === 'expression_statement') {
                const desc = current.join(' 且 ');
                if (desc.trim() !== '' && !paths.includes(desc)) {
                    paths.push(desc);
                }
            } else if (child.namedChildren && child.namedChildren.length > 0) {
                extractPaths(child, current, paths);
            }
        }
    }

    // === 主逻辑 ===
    const funcNode = findFunction(tree, targetFunc);
    if (!funcNode) {
        console.error(`❌ 未找到函数: ${targetFunc}`);
        return [];
    }

    const bodyNode = funcNode.namedChildren.find(child => child.type === 'block');
    const paths = [];
    extractPaths(bodyNode, [], paths);

    return paths;
}