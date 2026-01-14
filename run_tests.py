"""
Test Runner Script for HSD Platform
Runs all test suites and generates report
"""
import subprocess
import sys
from datetime import datetime


def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80 + "\n")


def print_section(text):
    """Print formatted section"""
    print("\n" + "-" * 80)
    print(f"  {text}")
    print("-" * 80)


def run_tests(test_path=None, verbosity=2):
    """
    Run Django tests
    
    Args:
        test_path: Specific test path (e.g., 'tests.test_users.UserAuthenticationTests')
        verbosity: Test output verbosity (0-3)
    """
    print_header("🧪 HSD Platform Test Suite")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Build command
    cmd = ['python', 'manage.py', 'test']
    
    if test_path:
        cmd.append(test_path)
        print(f"Running specific tests: {test_path}\n")
    else:
        cmd.append('tests')
        print("Running all tests...\n")
    
    cmd.extend(['--verbosity', str(verbosity)])
    
    # Run tests
    try:
        result = subprocess.run(cmd, cwd='backend', capture_output=False)
        return result.returncode
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        return 1


def run_specific_module(module_name):
    """Run tests for specific module"""
    module_map = {
        'users': 'tests.test_users',
        'activity': 'tests.test_activity',
        'tasks': 'tests.test_tasks',
        'projects': 'tests.test_projects',
        'events': 'tests.test_events',
        'meetings': 'tests.test_meetings',
        'committees': 'tests.test_committees',
        'notifications': 'tests.test_notifications',
    }
    
    if module_name in module_map:
        print_section(f"Testing {module_name.upper()} Module")
        return run_tests(module_map[module_name])
    else:
        print(f"❌ Unknown module: {module_name}")
        print(f"Available modules: {', '.join(module_map.keys())}")
        return 1


def run_coverage_report():
    """Run tests with coverage report"""
    print_header("📊 Running Tests with Coverage Report")
    
    try:
        # Install coverage if not present
        subprocess.run(['pip', 'install', 'coverage'], capture_output=True)
        
        # Run tests with coverage
        subprocess.run(['coverage', 'run', '--source=.', 'manage.py', 'test', 'tests'], cwd='backend')
        
        # Generate report
        print("\n")
        subprocess.run(['coverage', 'report'], cwd='backend')
        
        # Generate HTML report
        subprocess.run(['coverage', 'html'], cwd='backend')
        print("\n✅ HTML coverage report generated in backend/htmlcov/index.html")
        
        return 0
    except Exception as e:
        print(f"\n❌ Error running coverage: {e}")
        return 1


def main():
    """Main test runner"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == '--help' or command == '-h':
            print_header("HSD Platform Test Runner")
            print("Usage:")
            print("  python run_tests.py              # Run all tests")
            print("  python run_tests.py users        # Run specific module tests")
            print("  python run_tests.py --coverage   # Run with coverage report")
            print("  python run_tests.py --quick      # Run with minimal output")
            print("\nAvailable modules:")
            print("  users, activity, tasks, projects, events, meetings, committees, notifications")
            return 0
        
        elif command == '--coverage':
            return run_coverage_report()
        
        elif command == '--quick':
            return run_tests(verbosity=1)
        
        else:
            return run_specific_module(command)
    
    else:
        # Run all tests
        return run_tests()


if __name__ == '__main__':
    exit_code = main()
    
    if exit_code == 0:
        print_header("✅ All Tests Passed!")
    else:
        print_header("❌ Some Tests Failed")
    
    print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    sys.exit(exit_code)
