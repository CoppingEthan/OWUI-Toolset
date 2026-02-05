# https://docs.openwebui.com/troubleshooting/password-reset

  * [](/)
  * [🛠️ Troubleshooting](/troubleshooting/)
  * Reset Admin Password



On this page

# Resetting Your Admin Password 🗝️

If you've forgotten your admin password, don't worry! Below you'll find step-by-step guides to reset your admin password for Docker 🐳 deployments and local installations of Open WebUI.

## For Docker Deployments 🐳​

Follow these steps to reset the admin password for Open WebUI when deployed using Docker.

### Step 1: Generate a New Password Hash 🔐​

First, you need to create a bcrypt hash of your new password. Run the following command on your local machine, replacing `your-new-password` with the password you wish to use:
    
    
    htpasswd -bnBC 10 "" your-new-password | tr -d ':\n'  
    

note

**Note:** The output will include a bcrypt hash with special characters that need to be handled carefully. Any `$` characters in the hash will need to be triple-escaped (replaced with `\\\`) to be used correctly in the next step.

### Step 2: Update the Password in Docker 🔄​

Next, you'll update the password in your Docker deployment. Replace `HASH` in the command below with the bcrypt hash generated in Step 1, making sure to triple-escape any `$` characters. Also, replace `admin@example.com` with the email address linked to your admin account.

**Important:** The following command may not work in all cases. If it doesn't work for you, try the alternative command below it.
    
    
    docker run --rm -v open-webui:/data alpine/socat EXEC:"bash -c 'apk add sqlite && echo UPDATE auth SET password='\''HASH'\'' WHERE email='\''admin@example.com'\''; | sqlite3 /data/webui.db'", STDIO  
    

## For Local Installations 💻​

If you have a local installation of Open WebUI, here's how you can reset your admin password directly on your system.

### Step 1: Generate a New Password Hash 🔐​

Just as with the Docker method, start by generating a bcrypt hash of your new password using the following command. Remember to replace `your-new-password` with your new password:
    
    
    htpasswd -bnBC 10 "" your-new-password | tr -d ':\n'  
    

### Step 2: Update the Password Locally 🔄​

Now, navigate to the `open-webui` directory on your local machine. Update your password by replacing `HASH` with the bcrypt hash from Step 1 and `admin@example.com` with your admin account email, and execute:
    
    
    sqlite3 backend/data/webui.db "UPDATE auth SET password='HASH' WHERE email='admin@example.com';"  
    

#### Alternate Docker Method​

_If you have issues with the above._ I had issues chaining the `bash` commands in `alpine/socat`, _since`bash` doesn't exist._

  1. **Run`alpine` linux connected to the open-webui volume.**
         
         docker run -it --rm -v open-webui:/path/to/data alpine  
         

_`/path/to/data` depends on **your** volume settings._

     1. Install `apache2-utils` and `sqlite`:
            
            apk add apache2-utils sqlite  
            

     2. Generate `bcrypt` hash:
            
            htpasswd -bnBC 10 "" your-new-password | tr -d ':'  
            

     3. Update password:
            
            sqlite3 /path/to/data/webui.db  
            
            
            UPDATE auth SET password='HASH' WHERE email='admin@example.com';  
            -- exit sqlite: [Ctrl + d]  
            




## Nuking All the Data​

If you want to **completely reset** Open WebUI—including all user data, settings, and passwords—follow these steps to remove the `webui.db` file.

### Step 1: Locate `webui.db` in Your Python Environment​

If you’re unsure where `webui.db` is located (especially if you're using a virtual environment), you can find out by following these steps:

  1. Activate your virtual environment (if applicable).

  2. Open a Python shell: python

  3. Run the following code inside the Python shell:



    
    
       import os  
       import open_webui  
      
       # Show where the Open WebUI package is installed  
       print("Open WebUI is installed at:", open_webui.__file__)  
      
       # Construct a potential path to webui.db (commonly located in 'data/webui.db')  
       db_path = os.path.join(os.path.dirname(open_webui.__file__), "data", "webui.db")  
       print("Potential path to webui.db:", db_path)  
      
       # Check if webui.db exists at that path  
       if os.path.exists(db_path):  
           print("webui.db found at:", db_path)  
       else:  
           print("webui.db not found at:", db_path)  
    

  4. Examine the output:
     * If the file is found, you’ll see its exact path.
     * If not, you may need to perform a broader filesystem search (e.g., using `find` on Linux or a global file search on Windows/Mac).



### Step 2: Delete `webui.db`​

Once you’ve located the file, remove it using a command similar to:
    
    
       rm -rf /path/to/your/python/environment/lib/pythonX.X/site-packages/open_webui/data/webui.db  
    

warning

**Warning:** Deleting `webui.db` will remove all stored data, including user accounts, settings, and passwords. Only do this if you truly want to start fresh!

📖 By following these straightforward steps, you'll regain access to your Open WebUI admin account in no time. If you encounter any issues during the process, please consider searching for your issue on forums or community platforms.

[Edit this page](https://github.com/open-webui/docs/blob/main/docs/troubleshooting/password-reset.mdx)

[PreviousServer Connectivity Issues](/troubleshooting/connection-error)[NextAudio Troubleshooting](/troubleshooting/audio)

  * For Docker Deployments 🐳
    * Step 1: Generate a New Password Hash 🔐
    * Step 2: Update the Password in Docker 🔄
  * For Local Installations 💻
    * Step 1: Generate a New Password Hash 🔐
    * Step 2: Update the Password Locally 🔄
  * Nuking All the Data
    * Step 1: Locate `webui.db` in Your Python Environment
    * Step 2: Delete `webui.db`


