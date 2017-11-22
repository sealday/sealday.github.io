import Text.Pandoc.JSON 

main = toJSONFilter demoteHeaders 
  where demoteHeaders (Header lev attr xs) = Header (lev - 1) attr xs 
        demoteHeaders x = x 
