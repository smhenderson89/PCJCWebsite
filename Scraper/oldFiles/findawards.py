#!/usr/bin/env python3

import sys
import os.path
import re
import requests
import random
from PIL import Image
from io import BytesIO

# This program will generate a list of all of the awards on the PCJC website.
# Including the full directory name, so that the award html page and jpgs can be
# downloaded easily.

# Editing History
# 20250128: Dan Williamson
# 20250129: Dan Williamson

def main(argv):

  domain = "http://paccentraljc.org/"
  currentdirectory = ""
  thisfile = ""
  
  A = ("Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
       "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36",
       "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36",
       )

  
  #open the filelist.txt file
  filename = "filelist.txt"
  
  with open(filename, 'r') as filelist:
    lines = filelist.readlines()
    for row in lines:
      #print ("DEBUG: This row:{}".format(row.strip()))
      # ./[0.9]?: indicates a directory with awards in it
      # interesting case, there are several of these: ./20170801/20170619:
      regex = "^\.\/[\d\/]+:"
      if re.match(regex, row):
        #currentdirectory = ""
        currentdirectory = row.strip()
        currentdirectory = currentdirectory[2:(len(currentdirectory)-1)] + "/"
        print("DEBUG Found an award directory:{}".format(currentdirectory))
        
      # [0.9]?.html is an award html file - save this file and put it in ./awards/
      
      # DW developer's note: I figured out why this is giving me bad directory
      # information. There are some directories that contain award files
      # (dddddd.html) that are not recognized as award directories (/dddd/dddd:).
      
      # DW developer's note: When the end of a directory comes up, reset current
      # directory. When an award is found and the current directory is reset, 
      # reject the award.
      
      # DW developer's note: when doing a html request, you have to define the script's
      # user-agent, otherwise sites will reject the script's request with a 406 error.
      # Agent = A[random.randrange(len(A))] gets us a random user agent from a list of
      # them defined at the top of the script.
      # headers = {'user-agent': Agent} sets the randomized user agent.
      
      regex = "\d+\.html"
      if re.match(regex, row.strip()):
        thisfile = row.strip()
        # retrieve this file if the current directory is not reset
        if len(currentdirectory) > 1:
          fullname = domain + currentdirectory + thisfile
          print("DEBUG Found an award:{}".format(fullname))
          # Create agent for scrapper
          Agent = A[random.randrange(len(A))]
          headers = {'user-agent': Agent}          
          r = requests.get(fullname, headers=headers)
          # save it in ./awards/
          #print("DEBUG: Got award{}. . .".format(r.text))
          savefilename = "./Awards/" + thisfile
          #print("DEBUG: file to save {}".format(savefilename))
          f = open(savefilename, "w")
          f.write (r.text)
          f.close()
        
      #if row is an award image file:
      
      # DW Developer's note - simply saving the contents of a JPG file does not seem to 
      # work. We will have to access it as binary and save it as a JPG format using PIL?
      
      regex = "\d+\.jpg"  
      # [0.9]?.jpg is an award image file - save this one
      if re.match(regex, row.strip()):
        thisfile = row.strip()
        # retrieve this file if the current directory is not reset
        if len(currentdirectory) > 1:
          fullname = domain + currentdirectory + thisfile
          #print("DEBUG Found an image:{}".format(fullname))
          # GET the file
          # Create agent for scrapper
          Agent = A[random.randrange(len(A))]
          headers = {'user-agent': Agent}          
          r = requests.get(fullname, headers=headers)
          # save it in ./awards/
          savefilename = "./Awards/" + thisfile
          #print("DEBUG: file to save {}".format(savefilename))
          i = Image.open(BytesIO(r.content))
          i.save(savefilename, "JPEG")
          
      # a blank line indicates the end of a sub directory
      if len(row.strip()) < 1:
        # This is when we should reset any directory information
        #print ("DEBUG found the end of directory:{}".format(row.strip()))
        currentdirectory = ""
        
      # In any other circumstances, we should do nothing with the line
  
if __name__ == "__main__":
  main(sys.argv)


