<table border=0>
  <tr>
    <td valign="top"><h1>WebCL_Raytracer</h1>
      A Raytracer utilizing WebCL.<br />
      Written by Mark Becker<br />
      Kernel written by Mark Becker, Cameron Brown
      <hr>
      <ul>
        <font size='4'><b>Project description</b></font>
        <ul>
          This project was created to explore the usage of the newly developed specification WebCL.<br />
          A previously built project <a href"https://github.com/markbecker/OpenCL_Raytracer" target="_blank">OpenCL_Raytracer</a> was used as the basis for the application.<br />
          Like OpenCL, WebCL allows for direct access to the many-core environment of the CPU <br />
          and or GPU.<br />
          <br />
          A ray tracer was developed and used to demonstrate the power of parallelization.<br />
          <br />
        </ul>
        <br/>
        <font size='4'><b>Developed and tested on...</b></font>
        <ul>
          <li>Mark's Desktop:
            <ul>
              <li>OS - Windows 7 Professional 64-bit
              <li>CPU - Intel Core i5 760 @ 2.80GHz
              <li>MB - ASUS P7P55D-E Pro
              <li>VC - ATI Radeon HD 5750
              <li>AMD App Acceleration SDK
              <li>Intel SDK for OpenCL
            </ul>
        </ul>
      </ul>
      <hr>
      <ul>
        <font size='4'><b>Runtime Environment</b></font><br />
        <ol>
          The easy part...
          <li>This web application can only be run on Firefox browser<br />
          <li>The Nokia WebCL extension needs to be installed<br />
          <li>WebGL needs to be enabled<br />
          <li>WebCL needs to be enabled<br />
            All of this can be checked and or installed at <a href="http://webcl.nokiaresearch.com/index.html" target=blank>Nokia Research</a> <br />
            <br />
            The not as easy part...<br />
          <li>AMD App Acceleration SDK installed - <a href="http://developer.amd.com/sdks/AMDAPPSDK/Pages/default.aspx" target="_blank">AMD Developer Central</a><br />
          <li>Intel SDK for OpenCL installed - <a href="http://software.intel.com/en-us/articles/vcsource-tools-opencl-sdk/" target="_blank">Intel SDK for OpenCL</a><br />
            <br />
            The <a href="http://webcl.nokiaresearch.com/faq.html" target="_blank">FAQ</a> for Nokia Research's WebCL
        </ol>
      </ul>
      <ul>
        <font size='4'><b>Runtime Environment Concerns</b></font>
        <ul>
          <li> This application runs directly on the GPU or CPU. With that in mind, pushing the adjustments,<br />
            size, run count, may effect the computer it is run on. There was more than a few times that<br />
            during development the GPU was overflowed and needed to restart. It also may push the limits<br />
            of Firefox.
          <li> Therefore, a certain amount of caution needs to be used. But don't be afraid to use it.
        </ul>
      </ul>
      <hr>
      <table width="810" border="0" cellpadding="2" cellspacing="0">
        <tr>
          <td width="470" valign="top"><ul>
              <font size='4'><b>Web Page Interface</b></font>
            </ul></td>
          <td width="340" valign="top">&nbsp;</td>
        </tr>
        <tr>
          <td valign="top" colspan="2">Screen shot of page displayed:<br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot1.png" target=blank><img border=1 src="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot1.png" width="800" height="661" alt="Screenshot 1"/></a><br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot1.png" target=blank>Click for larger</a><br />
            <br /></td>
        </tr>
        <tr>
          <td width="470" valign="top"><ul>
              <font size='4'><b>Choose Device:</b></font><br />
              <ul>
                <li>The page creates a list of appropriate platforms and devices that can be used with the WebCL kernel.
                <li>Shown is both the Intel and AMD implementation of OpenCL.
              </ul>
            </ul></td>
          <td width="340" valign="top">Choose Device input section:<br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot2.png" target=blank> <img border=1 src="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot2.png" width="309" height="128" alt="Screenshot 2"/></a><br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot2.png" target=blank>Click for raw image</a><br /></td>
        </tr>
        <tr>
          <td width="470" valign="top"><ul>
              <font size='4'><b>Choose Images:</b></font><br />
              <ul>
                <li> There is three, preloaded, 'scene' text files of primitives that when used within the WebCl kernel will create the scene. Each scene, 1, 2, 3, creates a progressively more complicated image. With the increase of complicatedness, comes an increase in run-time.
              </ul>
            </ul>
            <ul>
              <font size='4'><b>Move Camera and View:</b></font><br />
              <ul>
                <li> When the scene is run at least once, the camera position and the viewing angle in the 3 dimensional realm can be changed. The 'Camera' set of adjustment buttons surround the cameras icon, and the 'Viewing Angle' buttons surround the eye icon.
              </ul>
            </ul></td>
          <td width="340" valign="top">Choose Image input section:<br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot3.png" target=blank> <img border=1 src="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot3.png" width="311" height="201" alt="Screenshot 3"/></a><br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot3.png" target=blank>Click for raw image</a><br /></td>
        </tr>
        <tr>
          <td width="470" valign="top"><ul>
              <font size='4'><b>Adjust Run:</b></font><br />
              <ul>
                <li> The 'Adjust Run' section of the input lets the user choose the final size of the image, 'Work Item' size, 'Trace Depth' and number of identical runs to average time-wise.
                <li> The width and height of the image need to be multiples of the work item [0] and [1] respectively. This is because the 'Work Items' in WebCL and OpenCL need to fit evenly into the global memory (screen size) allocated to the compute device.
              </ul>
            </ul></td>
          <td width="340" valign="top">Adjust Run input section:<br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot4.png" target=blank> <img border=1 src="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot4.png" width="309" height="123" alt="Screenshot 4"/></a><br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot4.png" target=blank>Click for raw image</a><br /></td>
        </tr>
        <tr>
          <td width="470" valign="top"><ul>
              <font size='4'><b>Built-in Functions:</b></font><br />
              <ul>
                <li> The 'Built-in Functions' lets the user choose the different functions that OpenCL provides.
                <li> OpenCL, therefore WebCL, allows for manufacturers to supply built-in, hardware based, functional units to handle some of the more common arithmetic operations. This should, in theory, increase the processing speed because the function is optimized for the hardware. Sometimes this is not the case. That is why the option is here, to test the differences.
              </ul>
            </ul></td>
          <td width="340" valign="top">Adjust Run input section:<br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot5.png" target=blank> <img border=1 src="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot5.png" width="309" height="106" alt="Screenshot 5"/></a><br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot5.png" target=blank>Click for raw image</a><br /></td>
        </tr>
        <tr>
          <td width="470" valign="top"><ul>
              <font size='4'><b>Information Output:</b></font><br />
              <ul>
                <li> The 'Information Output' is created after each run. The text is labeled to be self explanatory. Some of the information presented is based on the environment the code (kernel) is run on. The other info is specifically concerning the individual run(s) as in average run time.
              </ul>
            </ul></td>
          <td width="340" valign="top">Information output section:<br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot6.png" target=blank> <img border=1 src="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot6.png" width="309" height="295" alt="Screenshot 6"/></a><br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot6.png" target=blank>Click for raw image</a><br /></td>
        </tr>
        <tr>
          <td width="470" valign="top"><ul>
              <font size='4'><b>Scene Created:</b></font><br />
              <ul>
                <li> The largest section of the page is reserved for a displaying of the scene image created. The area is fixed to display a 800 by 600 image. Larger (and smaller) images can be created and scroll bars will be implemented accordingly.
              </ul>
            </ul></td>
          <td width="340" valign="top">Scene created section:<br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot7.png" target=blank> <img border=1 src="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot7.png" width="333" height="252" alt="Screenshot 7"/></a><br />
            <a href="https://github.com/markbecker/WebCL_Raytracer/raw/master/Graphics/screenshot7.png" target=blank>Click for raw image</a></td>
        </tr>
      </table>
      <hr>
      <ul>
        <font size='4'><b>What is a Ray tracer?</b></font>
        <ul>
          Ray tracing is a technique that generates an image by tracing the path of light through <br />
          pixels in an view plane and simulating the effects of its intersections with virtual objects.<br />
          Ray tracing is capable of producing an image of photo-realistic quality. usually higher than<br />
          that of scan-line rendering methods. Unfortunately this level of realism comes at a greater<br />
          computational cost.<br />
          <li><a href="http://en.wikipedia.org/wiki/Ray_tracing_(graphics)" target=blank>More info from Wikipedia</a>
        </ul>
        <br/>
        <font size='4'><b>What is WebCL?</b></font>
        <ul>
          The WebCL working group is working to define a JavaScript binding to the Khronos OpenCL <br />
          standard for heterogeneous parallel computing. WebCL will enable web applications to <br />
          harness GPU and multi-core CPU parallel processing from within a Web browser, enabling <br />
          significant acceleration of applications such as image and video processing and advanced <br />
          physics for WebGL games.<br />
          <li><a href="http://www.khronos.org/webcl/" target=blank>More info from Khronos</a>
        </ul>
        <br/>
        <font size='4'><b>What is Nokia Research doing?</b></font>
        <ul>
          Nokia Research has developed an extension for the Firefox web browser running on<br />
          Windows and 32-bit Linux.<br />
          <li><a href="http://webcl.nokiaresearch.com/index.html" target=blank>More info from Nokia Research</a>
        </ul>
      </ul>
      <hr></td>
  </tr>
</table>
