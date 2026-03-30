#!/usr/bin/env python3
import os
import sys
import subprocess
import json
import platform
import pkg_resources
from typing import Dict, List, Optional

class DependencyManager:
    def __init__(self, project_root: str):
        self.project_root = project_root
        self.services = [
            'backend',
            'frontend', 
            'resume-parser', 
            'code-executor', 
            'ai-evaluator'
        ]
        self.dependency_files = {
            'backend': ['package.json'],
            'frontend': ['package.json'],
            'resume-parser': ['requirements.txt'],
            'code-executor': ['requirements.txt'],
            'ai-evaluator': ['requirements.txt']
        }

    def find_dependency_files(self) -> Dict[str, List[str]]:
        """Find all dependency files in the project"""
        dependency_paths = {}
        for service in self.services:
            service_paths = []
            for filename in self.dependency_files.get(service, []):
                paths = self._find_files(filename, service)
                service_paths.extend(paths)
            dependency_paths[service] = service_paths
        return dependency_paths

    def _find_files(self, filename: str, service: str) -> List[str]:
        """Find specific files in service directories"""
        search_paths = [
            os.path.join(self.project_root, service),
            os.path.join(self.project_root, 'python-services', service),
            os.path.join(self.project_root, 'Server'),
            os.path.join(self.project_root, 'client')
        ]
        
        found_files = []
        for path in search_paths:
            file_path = os.path.join(path, filename)
            if os.path.exists(file_path):
                found_files.append(file_path)
        return found_files

    def parse_dependencies(self, dependency_file: str) -> Dict[str, str]:
        """Parse dependencies from different file types"""
        ext = os.path.splitext(dependency_file)[1]
        
        try:
            if ext == '.json':
                return self._parse_npm_dependencies(dependency_file)
            elif ext == '.txt':
                return self._parse_pip_dependencies(dependency_file)
            else:
                print(f"Unsupported dependency file type: {ext}")
                return {}
        except Exception as e:
            print(f"Error parsing {dependency_file}: {e}")
            return {}

    def _parse_npm_dependencies(self, package_json: str) -> Dict[str, str]:
        """Parse Node.js package.json dependencies"""
        with open(package_json, 'r') as f:
            data = json.load(f)
        
        dependencies = {}
        for section in ['dependencies', 'devDependencies']:
            dependencies.update(data.get(section, {}))
        
        return dependencies

    def _parse_pip_dependencies(self, requirements_txt: str) -> Dict[str, str]:
        """Parse Python requirements.txt dependencies"""
        dependencies = {}
        with open(requirements_txt, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    try:
                        req = pkg_resources.Requirement.parse(line)
                        dependencies[req.name] = str(req.specifier)
                    except Exception:
                        dependencies[line.split('==')[0]] = line
        return dependencies

    def check_dependency_conflicts(self) -> Dict[str, List[str]]:
        """Check for potential dependency conflicts"""
        conflicts = {}
        dependency_files = self.find_dependency_files()
        
        all_dependencies = {}
        for service, files in dependency_files.items():
            service_deps = {}
            for file in files:
                deps = self.parse_dependencies(file)
                service_deps.update(deps)
            all_dependencies[service] = service_deps

        # Cross-service conflict checking logic
        for service1, deps1 in all_dependencies.items():
            service_conflicts = []
            for service2, deps2 in all_dependencies.items():
                if service1 != service2:
                    common_deps = set(deps1.keys()) & set(deps2.keys())
                    for dep in common_deps:
                        if deps1[dep] != deps2[dep]:
                            service_conflicts.append(
                                f"Conflict in {dep}: {service1}={deps1[dep]} vs {service2}={deps2[dep]}"
                            )
            if service_conflicts:
                conflicts[service1] = service_conflicts

        return conflicts

    def generate_dependency_report(self) -> Dict:
        """Generate comprehensive dependency report"""
        report = {
            "dependency_files": self.find_dependency_files(),
            "dependency_conflicts": self.check_dependency_conflicts(),
            "system_info": {
                "python_version": platform.python_version(),
                "platform": platform.platform()
            }
        }
        return report

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dep_manager = DependencyManager(project_root)
    
    try:
        report = dep_manager.generate_dependency_report()
        print(json.dumps(report, indent=2))
        
        # Write report to file
        with open(os.path.join(project_root, 'dependency_report.json'), 'w') as f:
            json.dump(report, f, indent=2)
        
        # Check for conflicts
        conflicts = report.get('dependency_conflicts', {})
        if conflicts:
            print("\n🚨 Dependency Conflicts Detected:")
            for service, conflict_list in conflicts.items():
                print(f"{service}:")
                for conflict in conflict_list:
                    print(f"  - {conflict}")
            sys.exit(1)
    
    except Exception as e:
        print(f"Error generating dependency report: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
