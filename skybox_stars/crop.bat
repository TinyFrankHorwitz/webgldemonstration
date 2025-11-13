@echo off
setlocal enabledelayedexpansion

:: Prompt user for crop dimensions
set /p WIDTH=Enter crop width (pixels): 
set /p HEIGHT=Enter crop height (pixels): 

:: Optional: prompt for crop offset (default is top-left corner)
set /p XOFFSET=Enter X offset (default 0): 
if "%XOFFSET%"=="" set XOFFSET=0
set /p YOFFSET=Enter Y offset (default 0): 
if "%YOFFSET%"=="" set YOFFSET=0

:: Build crop geometry string
set CROP_GEOMETRY=%WIDTH%x%HEIGHT%+%XOFFSET%+%YOFFSET%

:: Loop through JPG files
for %%f in (*.jpg) do (
    magick "%%f" -crop %CROP_GEOMETRY% +repage "%%f"
)

:: Loop through PNG files
for %%f in (*.png) do (
    magick "%%f" -crop %CROP_GEOMETRY% +repage "%%f"
)

echo Cropping complete with geometry %CROP_GEOMETRY%.
pause
