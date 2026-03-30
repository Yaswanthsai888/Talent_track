#!/usr/bin/env python3
import os
import re
import json
import sys
import subprocess
import platform
from typing import Dict, List, Any

class SecurityAuditor:
    def __init__(self, project_root: str):
        self.project_root = project_root
        self.security_report = {
            "sensitive_info_exposure": [],
            "file_permissions": [],
            "potential_vulnerabilities": [],
            "dependency_security": [],
            "configuration_issues": []
        }

    def scan_sensitive_info(self) -> List[Dict[str, str]]:
        """Scan for potential sensitive information exposure"""
        sensitive_patterns = [
            r'(password|secret|token|key)\s*=\s*[\'"]([^\'"]+)[\'"]',  # Key-value pairs
            r'(password|secret|token|key)\s*:\s*[\'"]([^\'"]+)[\'"]',  # JSON-like patterns
            r'(https?://\S+:)(\S+)@',  # URLs with credentials
        ]
        
        sensitive_findings = []
        
        for root, _, files in os.walk(self.project_root):
            for file in files:
                if self._is_text_file(os.path.join(root, file)):
                    try:
                        with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                            content = f.read()
                            for pattern in sensitive_patterns:
                                matches = re.finditer(pattern, content, re.IGNORECASE)
                                for match in matches:
                                    sensitive_findings.append({
                                        "file": os.path.join(root, file),
                                        "line": content.split('\n')[content.find(match.group(0))],
                                        "match": match.group(0)
                                    })
                    except Exception as e:
                        print(f"Error reading {file}: {e}")
        
        return sensitive_findings

    def _is_text_file(self, filepath: str) -> bool:
        """Check if file is a text file"""
        text_extensions = [
            '.py', '.js', '.json', '.yml', '.yaml', '.env', 
            '.txt', '.md', '.html', '.css', '.conf', '.ini'
        ]
        return os.path.splitext(filepath)[1].lower() in text_extensions

    def check_file_permissions(self) -> List[Dict[str, str]]:
        """Check file and directory permissions"""
        sensitive_files = [
            '.env', 'id_rsa', 'id_rsa.pub', 
            'credentials', 'secrets', 'config.json'
        ]
        
        permission_issues = []
        
        for root, _, files in os.walk(self.project_root):
            for file in files:
                if any(sf in file.lower() for sf in sensitive_files):
                    filepath = os.path.join(root, file)
                    try:
                        mode = os.stat(filepath).st_mode
                        permissions = oct(mode)[-3:]
                        
                        # Check if file is too permissive
                        if int(permissions[1]) > 0 or int(permissions[2]) > 0:
                            permission_issues.append({
                                "file": filepath,
                                "permissions": permissions
                            })
                    except Exception as e:
                        print(f"Permission check error for {filepath}: {e}")
        
        return permission_issues

    def check_dependency_vulnerabilities(self) -> List[Dict[str, str]]:
        """Check dependencies for known vulnerabilities"""
        vulnerability_findings = []
        
        # Check Node.js dependencies
        try:
            npm_audit_result = subprocess.run(
                ['npm', 'audit', '--json'], 
                capture_output=True, 
                text=True, 
                cwd=os.path.join(self.project_root, 'Server')
            )
            npm_vulnerabilities = json.loads(npm_audit_result.stdout)
            
            for vuln in npm_vulnerabilities.get('vulnerabilities', {}).values():
                vulnerability_findings.append({
                    "package": vuln.get('name'),
                    "severity": vuln.get('severity'),
                    "overview": vuln.get('overview')
                })
        except Exception as e:
            print(f"NPM audit error: {e}")
        
        # Check Python dependencies
        try:
            safety_result = subprocess.run(
                ['safety', 'check'], 
                capture_output=True, 
                text=True
            )
            python_vulnerabilities = safety_result.stdout.split('\n')
            
            for vuln in python_vulnerabilities:
                if vuln.strip():
                    vulnerability_findings.append({
                        "vulnerability": vuln
                    })
        except Exception as e:
            print(f"Python dependency check error: {e}")
        
        return vulnerability_findings

    def check_configuration_issues(self) -> List[Dict[str, str]]:
        """Check for potential configuration security issues"""
        config_issues = []
        
        # Check .env file
        env_path = os.path.join(self.project_root, '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                env_content = f.read()
                if 'DEBUG=true' in env_content or 'NODE_ENV=development' in env_content:
                    config_issues.append({
                        "issue": "Development configuration in production environment",
                        "file": env_path
                    })
        
        # Check CORS configuration
        docker_compose_path = os.path.join(self.project_root, 'docker-compose.yml')
        if os.path.exists(docker_compose_path):
            with open(docker_compose_path, 'r') as f:
                compose_content = f.read()
                if '*' in compose_content:
                    config_issues.append({
                        "issue": "Overly permissive CORS configuration",
                        "file": docker_compose_path
                    })
        
        return config_issues

    def generate_security_report(self) -> Dict[str, Any]:
        """Generate comprehensive security report"""
        self.security_report = {
            "sensitive_info_exposure": self.scan_sensitive_info(),
            "file_permissions": self.check_file_permissions(),
            "potential_vulnerabilities": self.check_dependency_vulnerabilities(),
            "configuration_issues": self.check_configuration_issues(),
            "system_info": {
                "python_version": platform.python_version(),
                "platform": platform.platform()
            }
        }
        return self.security_report

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    security_auditor = SecurityAuditor(project_root)
    
    try:
        report = security_auditor.generate_security_report()
        print(json.dumps(report, indent=2))
        
        # Write report to file
        with open(os.path.join(project_root, 'security_report.json'), 'w') as f:
            json.dump(report, f, indent=2)
        
        # Check for critical issues
        critical_issues = (
            report.get('sensitive_info_exposure', []) +
            report.get('file_permissions', []) +
            report.get('potential_vulnerabilities', []) +
            report.get('configuration_issues', [])
        )
        
        if critical_issues:
            print("\n🚨 Security Issues Detected:")
            for issue in critical_issues:
                print(json.dumps(issue, indent=2))
            sys.exit(1)
    
    except Exception as e:
        print(f"Error generating security report: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
