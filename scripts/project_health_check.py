#!/usr/bin/env python3
import os
import sys
import subprocess
import json
import platform
import socket
import psutil
import importlib.util

class ProjectHealthChecker:
    def __init__(self, project_root):
        self.project_root = project_root
        self.health_report = {
            "system_info": {},
            "dependencies": {},
            "services": {},
            "security_checks": {},
            "performance": {}
        }

    def check_system_info(self):
        """Collect system information"""
        self.health_report["system_info"] = {
            "os": platform.platform(),
            "python_version": platform.python_version(),
            "cpu_cores": psutil.cpu_count(),
            "total_memory": psutil.virtual_memory().total / (1024 * 1024),
            "available_memory": psutil.virtual_memory().available / (1024 * 1024)
        }

    def check_dependencies(self):
        """Check project dependencies"""
        dependencies = [
            "flask", "pymongo", "redis", "pytest", 
            "spacy", "numpy", "scikit-learn"
        ]
        
        for dep in dependencies:
            spec = importlib.util.find_spec(dep)
            self.health_report["dependencies"][dep] = {
                "installed": spec is not None,
                "version": self._get_package_version(dep) if spec else None
            }

    def _get_package_version(self, package_name):
        """Get package version"""
        try:
            return __import__(package_name).__version__
        except (ImportError, AttributeError):
            return "Unknown"

    def check_services(self):
        """Check running services and ports"""
        services = {
            "mongodb": 27017,
            "redis": 6379,
            "backend": 5000,
            "frontend": 3000,
            "resume_parser": 5001,
            "code_executor": 5002
        }

        for service, port in services.items():
            self.health_report["services"][service] = self._check_port(port)

    def _check_port(self, port):
        """Check if a port is open"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return result == 0

    def check_security(self):
        """Perform basic security checks"""
        # Check for potential security issues
        security_checks = {
            "env_file_permissions": self._check_env_file_permissions(),
            "docker_socket_permissions": self._check_docker_socket_permissions(),
            "sensitive_files_exposure": self._check_sensitive_files()
        }
        self.health_report["security_checks"] = security_checks

    def _check_env_file_permissions(self):
        """Check .env file permissions"""
        env_path = os.path.join(self.project_root, '.env')
        return oct(os.stat(env_path).st_mode)[-3:] if os.path.exists(env_path) else "File not found"

    def _check_docker_socket_permissions(self):
        """Check Docker socket permissions"""
        try:
            docker_socket = "/var/run/docker.sock"
            return oct(os.stat(docker_socket).st_mode)[-3:] if os.path.exists(docker_socket) else "Socket not found"
        except Exception:
            return "Unable to check"

    def _check_sensitive_files(self):
        """Check for potentially exposed sensitive files"""
        sensitive_patterns = [
            "*.pem", "*.key", "*.cert", 
            "*credentials*", "*secret*"
        ]
        exposed_files = []
        for root, _, files in os.walk(self.project_root):
            for pattern in sensitive_patterns:
                exposed_files.extend([
                    os.path.join(root, f) for f in files 
                    if f.lower().endswith(pattern.replace('*', ''))
                ])
        return exposed_files

    def check_performance(self):
        """Basic performance checks"""
        self.health_report["performance"] = {
            "cpu_usage": psutil.cpu_percent(),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage(self.project_root).percent
        }

    def generate_report(self):
        """Generate comprehensive health report"""
        self.check_system_info()
        self.check_dependencies()
        self.check_services()
        self.check_security()
        self.check_performance()

        return json.dumps(self.health_report, indent=2)

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    health_checker = ProjectHealthChecker(project_root)
    
    try:
        report = health_checker.generate_report()
        print(report)
        
        # Optional: Write to file
        with open(os.path.join(project_root, 'health_report.json'), 'w') as f:
            f.write(report)
    
    except Exception as e:
        print(f"Error generating health report: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
