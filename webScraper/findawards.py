#!/usr/bin/env python3

import sys
import os.path
import re

# This program will generate a list of all of the awards on the PCJC website.
# Including the full directory name, so that the award html page and jpgs can be
# downloaded easily.

# Editing History
# 20250128: Dan Williamson

def main(argv):

  domain = "http://paccentraljc.org/"
  currentdirectory = ""
  thisfile = ""
  
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
      
      # DW developer's note: When the end f a directory comes up, reset current
      # directory. When an award is found and the current directory is rest, 
      # reject the award.
      
      regex = "\d+\.html"
      if re.match(regex, row.strip()):
        thisfile = row.strip()
        # retrieve this file if the current directory is not reset
        if len(currentdirectory) > 1:
          fullname = domain + currentdirectory + thisfile
          print("DEBUG Found an award:{} in directory:{}|".format(thisfile,currentdirectory))
          # save it in ./awards/
        
      regex = "\d+\.jpg"  
      # [0.9]?.jpg is an award image file - save this one
      #if row is an award image file:
      
      # retrieve the image
      # save it in ./awards/
      
      # a blank line indicates the end of a sub directory
      if len(row.strip()) < 1:
        # This is when we should reset any directory information
        #print ("DEBUG found the end of directory:{}".format(row.strip()))
        currentdirectory = ""
        
      # In any other circumstances, we should do nothing with the line
  
if __name__ == "__main__":
  main(sys.argv)


