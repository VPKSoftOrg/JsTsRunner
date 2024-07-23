# JsTsRunner
A software to evaluate JavaScript / TypeScript code.

## Features
* OS support: Windows, Linux and macOS<sup>1</sup>
* Supports both JavaScript and TypeScript code
* Supports multiple tabs
* Has an internal memory so the files / tab contents doesn't need to be saved on close
* Can transpile TypeScript to JavaScript
* Can evaluate the code either line by line or the entire file at once
* Supported locales: English, Finnish

(1) *NOT TESTED*

## Source code
To run, debug and modify the source code, read the instruction from the [template](https://github.com/VPKSoftOrg/tauri_react_vite_ts_script_antd_i18next_tokio_styled_v2) the software was created from, see: [wiki](https://github.com/VPKSoftOrg/tauri_react_vite_ts_script_antd_i18next_tokio_styled_v2/wiki)

# Install
## Windows
Download the [JsTsRunner_X.Y.Z_x64-setup.exe](https://github.com/VPKSoftOrg/JsTsRunner/releases/), ignore the warnings and install the software.
If the installation fails you may need to install webview2, See: https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section

## Linux
### AppImage
1. Download the [JsTsRunner_X.Y.Z_amd64.AppImage](https://github.com/VPKSoftOrg/JsTsRunner/releases/)
2. Run `chmod +x JsTsRunner_X.Y.Z_amd64.AppImage` on the file.
3. Run the JsTsRunner_X.Y.Z_amd64.AppImage file.
### .deb package
1. Download the [JsTsRunner_X.Y.Z_amd64.deb](https://github.com/VPKSoftOrg/JsTsRunner/releases/)
2. Run `sudo apt-get install JsTsRunner_X.Y.Z_amd64.deb`
3. Run the installed program.


## macOS
1. Download the [JsTsRunner_x64.app.tar.gz](https://github.com/VPKSoftOrg/JsTsRunner/releases/)
2. Extract the `JsTsRunner.app` from the file
3. Run `xattr -c JsTsRunner.app` on the file.
4. Run the `JsTsRunner.app`

## Screenshots
*A TypeScript file in an entire file evaluation mode*

![image](https://github.com/user-attachments/assets/2a064cb9-32ca-4878-8c9d-c79a7bf82c99)

*A JavaScript file in a an entire file evaluation mode*

![image](https://github.com/user-attachments/assets/489d1b3b-a346-4c86-b738-53c26b3dec72)

*The Light mode*

![image](https://github.com/user-attachments/assets/037511aa-4346-4e4e-82b8-654d042f0086)

*A run-time demo video*

![js_ts_demo](https://github.com/user-attachments/assets/30a21f61-5600-4d55-9c67-d12895d40c25)

## Made with
* [Tauri](https://v2.tauri.app)
* [React](https://react.dev)
* [i18next](https://www.i18next.com)
* [Font Awesome Free](https://fontawesome.com)
* [Styled Components](https://styled-components.com)
* [Ant Design](https://ant.design)
* [Monaco Editor for React](https://github.com/suren-atoyan/monaco-react)
* [Rusty V8](https://github.com/denoland/rusty_v8)

## Localize to your language
[Crowdin](https://crowdin.com/project/jstsrunner) is used for the software localization, so [contact me](https://github.com/VPKSoft) if you wish to contribute.

 <a href="https://crowdin.com"><img src="https://github.com/user-attachments/assets/6a541410-750a-40db-b345-903789010b9b" width="200px" /></a>

