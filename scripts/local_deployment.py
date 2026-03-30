#!/usr/bin/env python3
import sys
import subprocess
import platform
import json
import time
import socket
import os
import shutil

class LocalDeploymentManager:
    def __init__(self, project_root):
        self.project_root = project_root
        self.services = {
            'backend': {
                'path': 'Server',
                'start_cmd': 'npm run dev',
                'port': 5000,
                'health_endpoint': '/api/health'
            },
            'frontend': {
                'path': 'client',
                'start_cmd': 'npm run dev',
                'port': 3000,
                'health_endpoint': '/'
            }
        }
        self.deployment_log = []

    def find_executable(self, executable_name):
        """Find executable in system PATH"""
        for path in os.environ["PATH"].split(os.pathsep):
            exe_path = os.path.join(path, executable_name)
            if os.path.isfile(exe_path) and os.access(exe_path, os.X_OK):
                return exe_path
        return None

    def check_prerequisites(self):
        """Check system prerequisites"""
        prereqs = {
            'Python': self._check_python(),
            'Node.js': self._check_nodejs(),
            'npm': self._check_npm(),
            'MongoDB': self._check_mongodb(),
            'Redis': self._check_redis()
        }
        return prereqs

    def _check_python(self):
        """Check Python installation"""
        try:
            result = subprocess.run([sys.executable, '--version'], 
                                    capture_output=True, text=True)
            return result.stdout.strip()
        except Exception:
            return None

    def _check_nodejs(self):
        """Check Node.js installation"""
        nodejs_path = self.find_executable('node.exe')
        if nodejs_path:
            try:
                result = subprocess.run([nodejs_path, '--version'], 
                                        capture_output=True, text=True)
                return result.stdout.strip()
            except Exception:
                return None
        return None

    def _check_npm(self):
        """Check npm installation"""
        npm_path = self.find_executable('npm.cmd')
        if npm_path:
            try:
                result = subprocess.run([npm_path, '--version'], 
                                        capture_output=True, text=True)
                return result.stdout.strip()
            except Exception:
                return None
        return None

    def _check_mongodb(self):
        """Check MongoDB connection"""
        try:
            import pymongo
            client = pymongo.MongoClient('mongodb://localhost:27017/', 
                                         serverSelectionTimeoutMS=5000)
            client.admin.command('ping')
            return True
        except Exception:
            return False

    def _check_redis(self):
        """Check Redis connection"""
        try:
            import redis
            r = redis.Redis(host='localhost', port=6379, db=0, 
                            socket_connect_timeout=5)
            r.ping()
            return True
        except Exception:
            return False

    def install_dependencies(self):
        """Install project dependencies"""
        dependencies = [
            ('Server', 'npm ci'),
            ('client', 'npm ci')
        ]

        for service_path, install_cmd in dependencies:
            full_path = os.path.join(self.project_root, service_path)
            try:
                npm_path = self.find_executable('npm.cmd')
                if not npm_path:
                    print(f"npm not found for {service_path}")
                    return False
                
                result = subprocess.run(
                    [npm_path] + install_cmd.split(), 
                    cwd=full_path, 
                    capture_output=True, 
                    text=True
                )
                
                if result.returncode != 0:
                    print(f"Dependency installation failed for {service_path}")
                    print(result.stderr)
                    return False
                
                self.deployment_log.append(f"Installed dependencies for {service_path}")
            except Exception as e:
                print(f"Error installing dependencies for {service_path}: {e}")
                return False
        return True

    def start_services(self, services_to_start=None):
        """Start specified services"""
        if services_to_start is None:
            services_to_start = list(self.services.keys())

        service_processes = {}
        for service_name in services_to_start:
            if service_name not in self.services:
                print(f"Unknown service: {service_name}")
                continue

            service = self.services[service_name]
            service_path = os.path.join(self.project_root, service['path'])

            try:
                npm_path = self.find_executable('npm.cmd')
                if not npm_path:
                    print(f"npm not found for {service_name}")
                    continue

                process = subprocess.Popen(
                    [npm_path, 'run', 'dev'], 
                    cwd=service_path, 
                    stdout=subprocess.PIPE, 
                    stderr=subprocess.PIPE,
                    text=True
                )
                service_processes[service_name] = process
                self.deployment_log.append(f"Started {service_name} on port {service['port']}")
            except Exception as e:
                self.deployment_log.append(f"Failed to start {service_name}: {e}")
                return False

        return service_processes

    def check_service_health(self, timeout=30):
        """Check health of started services"""
        health_results = {}
        for service_name, service in self.services.items():
            try:
                # Simple socket connection test
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(timeout)
                result = sock.connect_ex(('localhost', service['port']))
                health_results[service_name] = result == 0
                sock.close()
            except Exception as e:
                health_results[service_name] = False
                self.deployment_log.append(f"Health check failed for {service_name}: {e}")

        return health_results

    def generate_deployment_report(self):
        """Generate comprehensive deployment report"""
        report = {
            'prerequisites': self.check_prerequisites(),
            'dependencies_installed': self.install_dependencies(),
            'service_health': self.check_service_health(),
            'deployment_log': self.deployment_log
        }
        return report

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    deployment_manager = LocalDeploymentManager(project_root)

    print("🚀 Starting Local Deployment Process")
    
    # Check prerequisites
    prereqs = deployment_manager.check_prerequisites()
    print("\n📋 Prerequisites:")
    for name, status in prereqs.items():
        print(f"{name}: {'✅ Installed' if status else '❌ Not Found'}")

    # Install dependencies
    print("\n📦 Installing Dependencies...")
    if not deployment_manager.install_dependencies():
        print("❌ Dependency installation failed")
        sys.exit(1)

    # Start services
    print("\n🔧 Starting Services...")
    service_processes = deployment_manager.start_services()
    
    # Check service health
    print("\n❤️ Checking Service Health...")
    health_status = deployment_manager.check_service_health()
    
    for service, status in health_status.items():
        print(f"{service}: {'🟢 Healthy' if status else '🔴 Unhealthy'}")

    # Generate and save deployment report
    report = deployment_manager.generate_deployment_report()
    report_path = os.path.join(project_root, 'deployment_report.json')
    
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Deployment report saved to {report_path}")

    # Keep services running
    input("\n🌐 Local deployment complete. Press Enter to stop services...")

    # Cleanup
    for process in service_processes.values():
        process.terminate()

if __name__ == "__main__":
    main()
