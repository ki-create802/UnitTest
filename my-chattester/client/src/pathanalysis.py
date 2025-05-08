# -*- coding: utf-8 -*-
import astroid
import inspect
import sys
import io
import os
from typing import List

# 解决 Windows 控制台编码问题
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_execution_paths(func_source: str) -> List[str]:
    tree = astroid.parse(func_source)
    paths = []

    def traverse_if_node(node, current_conditions):
        if isinstance(node, astroid.If):
            condition = node.test.as_string()
            new_conditions = current_conditions + [condition]
            for sub_node in node.body:
                traverse_if_node(sub_node, new_conditions)

            if node.orelse:
                negated_cond = f"not ({condition})"
                else_conditions = current_conditions + [negated_cond]
                for sub_node in node.orelse:
                    traverse_if_node(sub_node, else_conditions)
            else:
                path_desc = "且 ".join(new_conditions)
                paths.append(path_desc)

                negated_path = "且 ".join(current_conditions + [f"not ({condition})"])
                if negated_path not in paths:
                    paths.append(negated_path)
        else:
            if current_conditions:
                path_desc = "且 ".join(current_conditions)
                paths.append(path_desc)

    function_def = tree.body[0]
    for statement in function_def.body:
        traverse_if_node(statement, [])

    unique_paths = []
    seen = set()
    for path in paths:
        if path and path not in seen:
            seen.add(path)
            unique_paths.append(path)

    if not unique_paths:
        unique_paths.append("无条件执行路径")

    return unique_paths


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python analysis.py <file_path> <target_function>")
        sys.exit(1)

    file_path = sys.argv[1]
    target_method = sys.argv[2]

    # === 处理路径和模块导入 ===
    file_path = os.path.abspath(file_path)
    directory = os.path.dirname(file_path)
    file_name = os.path.basename(file_path)
    module_name = os.path.splitext(file_name)[0]

    sys.path.insert(0, directory)  # 添加模块所在目录到 sys.path

    try:
        module = __import__(module_name)
        target_function = getattr(module, target_method)
        func_source = inspect.getsource(target_function)
        paths = extract_execution_paths(func_source)

        for i, path in enumerate(paths, 1):
            print(f"路径{i}: {path}")
    except Exception as e:
        print(f"分析过程中出错: {e}")
        sys.exit(1)
