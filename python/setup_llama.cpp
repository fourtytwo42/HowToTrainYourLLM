import subprocess
import os
import sys

def setup_llama_cpp():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    llama_cpp_dir = os.path.join(script_dir, "llama.cpp")
    
    # Clone llama.cpp if it doesn't exist
    if not os.path.exists(llama_cpp_dir):
        print("Cloning llama.cpp repository...")
        subprocess.check_call([
            "git", "clone", "https://github.com/ggerganov/llama.cpp.git",
            llama_cpp_dir
        ])
    
    # Change to llama.cpp directory
    os.chdir(llama_cpp_dir)
    
    # Build llama.cpp
    print("Building llama.cpp...")
    if sys.platform == "win32":
        # Windows build
        subprocess.check_call(["cmake", "-B", "build", "-DCMAKE_BUILD_TYPE=Release"])
        subprocess.check_call(["cmake", "--build", "build", "--config", "Release"])
    else:
        # Linux/macOS build
        subprocess.check_call(["make"])
    
    print("llama.cpp setup completed successfully!")

if __name__ == "__main__":
    setup_llama_cpp() 