#!/usr/bin/env python3

import sys
import os.path
import re

def lookfor (searchterm, lines, regextext, offsetlines):
  for row in lines:
    # Look for the searchterm
    if row.find(searchterm) != -1:
      foundlinenum  = lines.index(row) + offsetlines
      #print ('DEBUG: we got {} and {}'.format(foundlinenum, lines[foundlinenum]))
      try:
        foundvalue = re.search(regextext, lines[foundlinenum]).group(1)
      except AttributeError:
        foundvalue = 'not found'
      return foundvalue
  return 'no match'

def scrape_award (filename):
  print ("DEBUG: opening file {}".format(filename))
  # open the file
  with open(filename, 'r') as awardfile:
    # award is a dictionary
    # read all lines using readline()
    lines = awardfile.readlines()
    
    plantname = lookfor('<title>', lines, '<title>(.+?)</title>', 0)
    plantname = plantname.strip()
    # clone
    clone = re.search("'(.+?)'$", plantname).group(1)
    # genus
    genus = plantname.split()
    genus = genus[0]
    # species/hybrid
    # remove the clone name
    species = re.search("^(.+?)'", plantname).group(1)
    species = species.strip()
    # remove the genus and you are left with the species/hybrid name
    species = re.search("^.+? (.+?)$",species).group(1)
    
    #print('DEBUG: The the plant is {} genus {}, species {}, clone {}'.format(plantname,genus,species,clone))
    
    # date and location are 6 lines below plant name
    # Cross is 8 lines below plant name 
    for row in lines:
      if row.find('<title>') != -1:
        datelinenum  = lines.index(row) + 7 
        try:
          datevalue = re.search('">(.+?)$', lines[datelinenum]).group(1)
          (datevalue,location) = datevalue.split('-')
          datevalue = datevalue.strip()
          location = location.strip()
        except AttributeError:
          datevalue = 'not found'
    
        crosslinenum = lines.index(row) + 9
        try:
          crossvalue = re.search('">(.+?)$', lines[crosslinenum]).group(1)
          crossvalue = crossvalue.strip()
        except AttributeError:
          crossvalue = 'not found' 
    #print('DEBUG: The date is {} location is {}'.format(datevalue,location))
    #print('DEBUG: The cross is {}'.format(crossvalue))

    exhibitor = lookfor('Exhibited', lines, 'by: (.+?)$', 0)
    #print('DEBUG: The exhibitor of the plant is {}'.format(exhibitor))

    # award is one line above the exhibitor
    for row in lines:
      if row.find('Exhibited') != -1:
        awardlinenum  = lines.index(row) -1 
        try:
          awardvalue = re.search('">(.+?)$', lines[awardlinenum]).group(1)
          (award, awardpoints) = awardvalue.split()
        except AttributeError:
          awardvalue = 'not found' 
    #print('DEBUG: The award is {} points {}'.format(award,awardpoints))

    photographer = lookfor('Photographer', lines, 'Photographer: (.+?)$', 0)
    #print('DEBUG: The Photographer of the plant is {}'.format(photographer))

    awardnum = lookfor('Award 2', lines, 'Award (.+?)<', 0)
    #print('DEBUG: The Award Number of the plant is {}'.format(awardnum))

    nsnum = lookfor(';NS', lines, '>(.+?)<', 2)
    #print('DEBUG: The NS of the plant is {}'.format(nsnum))
    
    nsvnum = lookfor(';NSV', lines, '>(.+?)<', 2)
    #print('DEBUG: The NSV of the plant is {}'.format(nsvnum))

    dswnum = lookfor(';DSW', lines, '>(.+?)<', 2)
    #print('DEBUG: The DSW of the plant is {}'.format(dswnum))

    dslnum = lookfor(';DSL', lines, '>(.+?)<', 2)
    #print('DEBUG: The DSL of the plant is {}'.format(dslnum))

    petwnum = lookfor(';PETW', lines, '>(.+?)<', 2)
    #print('DEBUG: The PETW of the plant is {}'.format(petwnum))

    petlnum = lookfor(';PETL', lines, '>(.+?)<', 2)
    #print('DEBUG: The PETL of the plant is {}'.format(petlnum))

    lswnum = lookfor(';LSW', lines, '>(.+?)<', 2)
    #print('DEBUG: The LSW of the plant is {}'.format(lswnum))

    lslnum = lookfor(';LSL', lines, '>(.+?)<', 2)
    #print('DEBUG: The LSL of the plant is {}'.format(lslnum))

    lipwnum = lookfor(';LIPW', lines, '>(.+?)<', 2)
    #print('DEBUG: The LIPW of the plant is {}'.format(lipwnum))

    liplnum = lookfor(';LIPL', lines, '>(.+?)<', 2)
    #print('DEBUG: The LIPL of the plant is {}'.format(liplnum))
    
    numflwrs = lookfor(' flwrs<', lines, '">(.+?)</', 2)
    #print('DEBUG: The num flwrs of the plant is {}'.format(numflwrs))
    
    numbuds = lookfor(' buds<', lines, '">(.+?)</', 2)
    #print('DEBUG: The num buds of the plant is {}'.format(numbuds))
    
    numinfl = lookfor(' infl<', lines, '">(.+?)</', 2)
    #print('DEBUG: The num infl of the plant is {}'.format(numinfl))

    # get the description
    for row in lines:
      if row.find('"+1">Description</font') != -1:
        descStartlinenum  = lines.index(row) +1
        #print('DEBUG: Description starts on line {}'.format(descStartlinenum))
        #print('DEBUG: the line is {}'.format(lines[descStartlinenum]))
        try:
          description = "not implemented"
        except AttributeError:
          description = 'not found' 
    for row in lines[descStartlinenum:]:
        if row.find('</font>') != -1:
          descEndlinenum = lines.index(row) -1
          #print('DEBUG: Description ends on line {}'.format(descEndlinenum))
          #print('DEBUG: the line is -{}-'.format(lines[descEndlinenum]))
          break
    #print('DEBUG: after break')
    #print('DEBUG: The description is {}'.format(description))
    description = ""
    for row in lines[descStartlinenum:descEndlinenum]:
      # look for strange characters in the row, if so, escape them
      # remove extra spaces and line breaks
      cleanRow = row.strip()
      # convert any " to '
      cleanRow = re.sub(r'"', "'", cleanRow)
      # escape any strange characters
      # if the row is not empty, append it
      if len(cleanRow) > 1:
        description = description + " " + cleanRow
    description = description.strip()
    print('DEBUG: The description is {}'.format(description))

    awardfile.close()
  return

def main(argv):
  # get a list of all the award files online
  
  # For each file
  thisfile = "20245383.html"
  scrape_award(thisfile)

if __name__ == "__main__":
  main(sys.argv)

