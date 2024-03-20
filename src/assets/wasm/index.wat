(module
 (type $0 (func (param i32 i32)))
 (type $1 (func))
 (type $2 (func (param i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32) (result i32)))
 (type $3 (func (param i32)))
 (type $4 (func (param i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32) (result i32)))
 (type $5 (func (param i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32)))
 (type $6 (func (param i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32) (result i32)))
 (import "env" "memory" (memory $0 2))
 (global $assembly/tms9918a/MODE_GRAPHICS i32 (i32.const 0))
 (global $assembly/tms9918a/MODE_TEXT i32 (i32.const 1))
 (global $assembly/tms9918a/MODE_BITMAP i32 (i32.const 2))
 (global $assembly/tms9918a/MODE_MULTICOLOR i32 (i32.const 3))
 (global $assembly/tms9918a/MODE_BITMAP_TEXT i32 (i32.const 4))
 (global $assembly/tms9918a/MODE_BITMAP_MULTICOLOR i32 (i32.const 5))
 (global $assembly/tms9918a/MODE_ILLEGAL i32 (i32.const 6))
 (global $assembly/tms9918a/vdpRAMAddr i32 (i32.const 0))
 (global $assembly/tms9918a/paletteAddr i32 (i32.const 65536))
 (global $assembly/tms9918a/scanlineColorBufferAddr i32 (i32.const 69632))
 (global $assembly/tms9918a/spriteBufferAddr i32 (i32.const 73728))
 (global $assembly/f18a/MODE_GRAPHICS i32 (i32.const 0))
 (global $assembly/f18a/MODE_TEXT i32 (i32.const 1))
 (global $assembly/f18a/MODE_TEXT_80 i32 (i32.const 2))
 (global $assembly/f18a/MODE_BITMAP i32 (i32.const 3))
 (global $assembly/f18a/MODE_MULTICOLOR i32 (i32.const 4))
 (global $assembly/f18a/COLOR_MODE_NORMAL i32 (i32.const 0))
 (global $assembly/f18a/COLOR_MODE_ECM_1 i32 (i32.const 1))
 (global $assembly/f18a/COLOR_MODE_ECM_2 i32 (i32.const 2))
 (global $assembly/f18a/COLOR_MODE_ECM_3 i32 (i32.const 3))
 (global $assembly/f18a/vdpRAMAddr i32 (i32.const 0))
 (global $assembly/f18a/paletteAddr i32 (i32.const 65536))
 (global $assembly/f18a/scanlineColorBufferAddr i32 (i32.const 69632))
 (global $assembly/f18a/spriteColorBufferAddr i32 (i32.const 73728))
 (global $assembly/f18a/spritePaletteBaseIndexBufferAddr i32 (i32.const 77824))
 (global $assembly/f18a/pixelTilePriority (mut i32) (i32.const 0))
 (global $assembly/f18a/pixelTransparentColor0 (mut i32) (i32.const 0))
 (global $assembly/f18a/pixelColor (mut i32) (i32.const 0))
 (global $assembly/f18a/pixelPaletteBaseIndex (mut i32) (i32.const 0))
 (table $0 1 1 funcref)
 (elem $0 (i32.const 1))
 (export "drawScanline9918a" (func $assembly/tms9918a/drawScanline))
 (export "drawScanlineF18a" (func $assembly/f18a/drawScanline))
 (export "memory" (memory $0))
 (func $assembly/tms9918a/initSpriteBuffer
  global.get $assembly/tms9918a/spriteBufferAddr
  i32.const 255
  i32.const 256
  i32.const 2
  i32.shl
  memory.fill
 )
 (func $assembly/tms9918a/setSpriteBuffer (param $offset i32) (param $value i32)
  global.get $assembly/tms9918a/spriteBufferAddr
  local.get $offset
  i32.const 2
  i32.shl
  i32.add
  local.get $value
  i32.store
 )
 (func $assembly/tms9918a/drawScanline (param $y i32) (param $width i32) (param $height i32) (param $screenMode i32) (param $textMode i32) (param $bitmapMode i32) (param $fgColor i32) (param $bgColor i32) (param $nameTable i32) (param $colorTable i32) (param $charPatternTable i32) (param $colorTableMask i32) (param $patternTableMask i32) (param $spriteAttributeTable i32) (param $spritePatternTable i32) (param $vr1 i32) (param $vr4 i32) (param $displayOn i32) (param $statusRegister i32) (result i32)
  (local $drawWidth i32)
  (local $hBorder i32)
  (local $vBorder i32)
  (local $spriteSize i32)
  (local $spriteMagnify i32)
  (local $spriteDimension i32)
  (local $imageDataAddr i32)
  (local $collision i32)
  (local $fifthSprite i32)
  (local $fifthSpriteIndex i32)
  (local $x i32)
  (local $color i32)
  (local $rgbColor i32)
  (local $name i32)
  (local $tableOffset i32)
  (local $colorByte i32)
  (local $patternByte i32)
  (local $yScreen i32)
  (local $spritesOnLine i32)
  (local $endMarkerFound i32)
  (local $spriteAttributeAddr i32)
  (local $spriteIndex i32)
  (local $addr i32)
  (local $ySpriteTop i32)
  (local $ySpriteBottom i32)
  (local $yAdjusted i32)
  (local $yMasked i32)
  (local $addr|46 i32)
  (local $xSprite i32)
  (local $addr|48 i32)
  (local $sPatternNo i32)
  (local $addr|50 i32)
  (local $sColor i32)
  (local $addr|52 i32)
  (local $sLine i32)
  (local $sPatternBase i32)
  (local $sx1 i32)
  (local $sx2 i32)
  (local $sx3 i32)
  (local $addr|58 i32)
  (local $sPatternByte i32)
  (local $offset i32)
  (local $rowOffset i32)
  (local $lineOffset i32)
  (local $x1 i32)
  (local $64 i32)
  (local $addr|65 i32)
  (local $addr|66 i32)
  (local $addr|67 i32)
  (local $addr|68 i32)
  (local $addr|69 i32)
  (local $addr|70 i32)
  (local $addr|71 i32)
  (local $addr|72 i32)
  (local $addr|73 i32)
  (local $addr|74 i32)
  (local $addr|75 i32)
  (local $addr|76 i32)
  (local $addr|77 i32)
  (local $addr|78 i32)
  (local $offset|79 i32)
  (local $spriteColor i32)
  (local $i i32)
  (local $82 i32)
  (local $addr|83 i32)
  (local $value i32)
  (local $i|85 i32)
  (local $86 i32)
  (local $addr|87 i32)
  (local $value|88 i32)
  local.get $textMode
  i32.eqz
  if (result i32)
   i32.const 256
  else
   i32.const 240
  end
  local.set $drawWidth
  local.get $width
  local.get $drawWidth
  i32.sub
  i32.const 1
  i32.shr_s
  local.set $hBorder
  local.get $height
  i32.const 192
  i32.sub
  i32.const 1
  i32.shr_s
  local.set $vBorder
  local.get $vr1
  i32.const 2
  i32.and
  i32.const 0
  i32.ne
  local.set $spriteSize
  local.get $vr1
  i32.const 1
  i32.and
  local.set $spriteMagnify
  local.get $spriteSize
  if (result i32)
   i32.const 16
  else
   i32.const 8
  end
  local.get $spriteMagnify
  if (result i32)
   i32.const 1
  else
   i32.const 0
  end
  i32.shl
  local.set $spriteDimension
  i32.const 0
  local.set $imageDataAddr
  i32.const 0
  local.set $collision
  i32.const 0
  local.set $fifthSprite
  i32.const 31
  local.set $fifthSpriteIndex
  i32.const 0
  local.set $color
  local.get $y
  local.get $vBorder
  i32.ge_s
  if (result i32)
   local.get $y
   local.get $vBorder
   i32.const 192
   i32.add
   i32.lt_s
  else
   i32.const 0
  end
  if (result i32)
   local.get $displayOn
  else
   i32.const 0
  end
  if
   local.get $y
   local.get $vBorder
   i32.sub
   local.set $yScreen
   local.get $textMode
   i32.eqz
   if
    call $assembly/tms9918a/initSpriteBuffer
    i32.const 0
    local.set $spritesOnLine
    i32.const 0
    local.set $endMarkerFound
    local.get $spriteAttributeTable
    local.set $spriteAttributeAddr
    i32.const 0
    local.set $spriteIndex
    loop $for-loop|0
     local.get $spriteIndex
     i32.const 32
     i32.lt_s
     if (result i32)
      local.get $spritesOnLine
      i32.const 4
      i32.le_s
     else
      i32.const 0
     end
     if (result i32)
      local.get $endMarkerFound
      i32.eqz
     else
      i32.const 0
     end
     if
      block $assembly/tms9918a/getRAMByte|inlined.0 (result i32)
       local.get $spriteAttributeAddr
       local.set $addr
       global.get $assembly/tms9918a/vdpRAMAddr
       local.get $addr
       i32.add
       i32.load8_u
       br $assembly/tms9918a/getRAMByte|inlined.0
      end
      i32.const 255
      i32.and
      local.set $ySpriteTop
      local.get $ySpriteTop
      i32.const 208
      i32.ne
      if
       local.get $ySpriteTop
       i32.const 208
       i32.gt_s
       if
        local.get $ySpriteTop
        i32.const 256
        i32.sub
        local.set $ySpriteTop
       end
       local.get $ySpriteTop
       i32.const 1
       i32.add
       local.set $ySpriteTop
       local.get $ySpriteTop
       local.get $spriteDimension
       i32.add
       local.set $ySpriteBottom
       i32.const -1
       local.set $yAdjusted
       local.get $spriteIndex
       i32.const 8
       i32.lt_s
       if (result i32)
        i32.const 1
       else
        local.get $bitmapMode
        i32.eqz
       end
       if (result i32)
        i32.const 1
       else
        local.get $vr4
        i32.const 3
        i32.and
        i32.const 3
        i32.eq
       end
       if
        local.get $yScreen
        local.get $ySpriteTop
        i32.ge_s
        if (result i32)
         local.get $yScreen
         local.get $ySpriteBottom
         i32.lt_s
        else
         i32.const 0
        end
        if
         local.get $yScreen
         local.set $yAdjusted
        end
       else
        local.get $yScreen
        i32.const 1
        i32.sub
        local.get $vr4
        i32.const 3
        i32.and
        i32.const 6
        i32.shl
        i32.const 63
        i32.or
        i32.and
        local.set $yMasked
        local.get $yMasked
        local.get $ySpriteTop
        i32.ge_s
        if (result i32)
         local.get $yMasked
         local.get $ySpriteBottom
         i32.lt_s
        else
         i32.const 0
        end
        if
         local.get $yMasked
         local.set $yAdjusted
        else
         local.get $yScreen
         i32.const 64
         i32.ge_s
         if (result i32)
          local.get $yScreen
          i32.const 128
          i32.lt_s
         else
          i32.const 0
         end
         if (result i32)
          local.get $yScreen
          local.get $ySpriteTop
          i32.ge_s
         else
          i32.const 0
         end
         if (result i32)
          local.get $yScreen
          local.get $ySpriteBottom
          i32.lt_s
         else
          i32.const 0
         end
         if
          local.get $yScreen
          local.set $yAdjusted
         end
        end
       end
       local.get $yAdjusted
       i32.const -1
       i32.ne
       if
        local.get $spritesOnLine
        i32.const 4
        i32.lt_s
        if
         block $assembly/tms9918a/getRAMByte|inlined.1 (result i32)
          local.get $spriteAttributeAddr
          i32.const 1
          i32.add
          local.set $addr|46
          global.get $assembly/tms9918a/vdpRAMAddr
          local.get $addr|46
          i32.add
          i32.load8_u
          br $assembly/tms9918a/getRAMByte|inlined.1
         end
         i32.const 255
         i32.and
         local.set $xSprite
         block $assembly/tms9918a/getRAMByte|inlined.2 (result i32)
          local.get $spriteAttributeAddr
          i32.const 2
          i32.add
          local.set $addr|48
          global.get $assembly/tms9918a/vdpRAMAddr
          local.get $addr|48
          i32.add
          i32.load8_u
          br $assembly/tms9918a/getRAMByte|inlined.2
         end
         local.get $spriteSize
         if (result i32)
          i32.const 252
         else
          i32.const 255
         end
         i32.and
         local.set $sPatternNo
         block $assembly/tms9918a/getRAMByte|inlined.3 (result i32)
          local.get $spriteAttributeAddr
          i32.const 3
          i32.add
          local.set $addr|50
          global.get $assembly/tms9918a/vdpRAMAddr
          local.get $addr|50
          i32.add
          i32.load8_u
          br $assembly/tms9918a/getRAMByte|inlined.3
         end
         i32.const 15
         i32.and
         local.set $sColor
         block $assembly/tms9918a/getRAMByte|inlined.4 (result i32)
          local.get $spriteAttributeAddr
          i32.const 3
          i32.add
          local.set $addr|52
          global.get $assembly/tms9918a/vdpRAMAddr
          local.get $addr|52
          i32.add
          i32.load8_u
          br $assembly/tms9918a/getRAMByte|inlined.4
         end
         i32.const 128
         i32.and
         i32.const 0
         i32.ne
         if
          local.get $xSprite
          i32.const 32
          i32.sub
          local.set $xSprite
         end
         local.get $yAdjusted
         local.get $ySpriteTop
         i32.sub
         local.get $spriteMagnify
         i32.shr_s
         local.set $sLine
         local.get $spritePatternTable
         local.get $sPatternNo
         i32.const 3
         i32.shl
         i32.add
         local.get $sLine
         i32.add
         local.set $sPatternBase
         i32.const 0
         local.set $sx1
         loop $for-loop|1
          local.get $sx1
          local.get $spriteDimension
          i32.lt_s
          if
           local.get $xSprite
           local.get $sx1
           i32.add
           local.set $sx2
           local.get $sx2
           i32.const 0
           i32.ge_s
           if (result i32)
            local.get $sx2
            local.get $drawWidth
            i32.lt_s
           else
            i32.const 0
           end
           if
            local.get $sx1
            local.get $spriteMagnify
            i32.shr_s
            local.set $sx3
            block $assembly/tms9918a/getRAMByte|inlined.5 (result i32)
             local.get $sPatternBase
             local.get $sx3
             i32.const 8
             i32.ge_s
             if (result i32)
              i32.const 16
             else
              i32.const 0
             end
             i32.add
             local.set $addr|58
             global.get $assembly/tms9918a/vdpRAMAddr
             local.get $addr|58
             i32.add
             i32.load8_u
             br $assembly/tms9918a/getRAMByte|inlined.5
            end
            i32.const 255
            i32.and
            local.set $sPatternByte
            local.get $sPatternByte
            i32.const 128
            local.get $sx3
            i32.const 7
            i32.and
            i32.shr_s
            i32.and
            i32.const 0
            i32.ne
            if
             block $assembly/tms9918a/getSpriteBuffer|inlined.0 (result i32)
              local.get $sx2
              local.set $offset
              global.get $assembly/tms9918a/spriteBufferAddr
              local.get $offset
              i32.const 2
              i32.shl
              i32.add
              i32.load
              br $assembly/tms9918a/getSpriteBuffer|inlined.0
             end
             i32.const -1
             i32.eq
             if
              local.get $sx2
              local.get $sColor
              call $assembly/tms9918a/setSpriteBuffer
             else
              i32.const 1
              local.set $collision
             end
            end
           end
           local.get $sx1
           i32.const 1
           i32.add
           local.set $sx1
           br $for-loop|1
          end
         end
        end
        local.get $spritesOnLine
        i32.const 1
        i32.add
        local.set $spritesOnLine
       end
       local.get $spriteAttributeAddr
       i32.const 4
       i32.add
       local.set $spriteAttributeAddr
      else
       i32.const 1
       local.set $endMarkerFound
      end
      local.get $spriteIndex
      i32.const 1
      i32.add
      local.set $spriteIndex
      br $for-loop|0
     end
    end
    local.get $spritesOnLine
    i32.const 5
    i32.eq
    if (result i32)
     local.get $fifthSprite
     i32.eqz
    else
     i32.const 0
    end
    if
     i32.const 1
     local.set $fifthSprite
     local.get $spriteIndex
     i32.const 1
     i32.sub
     local.set $fifthSpriteIndex
    end
   end
   local.get $textMode
   i32.eqz
   if (result i32)
    local.get $yScreen
    i32.const 3
    i32.shr_s
    i32.const 5
    i32.shl
   else
    local.get $yScreen
    i32.const 3
    i32.shr_s
    i32.const 40
    i32.mul
   end
   local.set $rowOffset
   local.get $yScreen
   i32.const 7
   i32.and
   local.set $lineOffset
   i32.const 0
   local.set $x
   loop $for-loop|2
    local.get $x
    local.get $width
    i32.lt_s
    if
     local.get $x
     local.get $hBorder
     i32.ge_s
     if (result i32)
      local.get $x
      local.get $hBorder
      local.get $drawWidth
      i32.add
      i32.lt_s
     else
      i32.const 0
     end
     if
      local.get $x
      local.get $hBorder
      i32.sub
      local.set $x1
      block $break|3
       block $case6|3
        block $case5|3
         block $case4|3
          block $case3|3
           block $case2|3
            block $case1|3
             block $case0|3
              local.get $screenMode
              local.set $64
              local.get $64
              global.get $assembly/tms9918a/MODE_GRAPHICS
              i32.eq
              br_if $case0|3
              local.get $64
              global.get $assembly/tms9918a/MODE_BITMAP
              i32.eq
              br_if $case1|3
              local.get $64
              global.get $assembly/tms9918a/MODE_MULTICOLOR
              i32.eq
              br_if $case2|3
              local.get $64
              global.get $assembly/tms9918a/MODE_TEXT
              i32.eq
              br_if $case3|3
              local.get $64
              global.get $assembly/tms9918a/MODE_BITMAP_TEXT
              i32.eq
              br_if $case4|3
              local.get $64
              global.get $assembly/tms9918a/MODE_BITMAP_MULTICOLOR
              i32.eq
              br_if $case5|3
              local.get $64
              global.get $assembly/tms9918a/MODE_ILLEGAL
              i32.eq
              br_if $case6|3
              br $break|3
             end
             block $assembly/tms9918a/getRAMByte|inlined.6 (result i32)
              local.get $nameTable
              local.get $rowOffset
              i32.add
              local.get $x1
              i32.const 3
              i32.shr_s
              i32.add
              local.set $addr|65
              global.get $assembly/tms9918a/vdpRAMAddr
              local.get $addr|65
              i32.add
              i32.load8_u
              br $assembly/tms9918a/getRAMByte|inlined.6
             end
             i32.const 255
             i32.and
             local.set $name
             block $assembly/tms9918a/getRAMByte|inlined.7 (result i32)
              local.get $colorTable
              local.get $name
              i32.const 3
              i32.shr_s
              i32.add
              local.set $addr|66
              global.get $assembly/tms9918a/vdpRAMAddr
              local.get $addr|66
              i32.add
              i32.load8_u
              br $assembly/tms9918a/getRAMByte|inlined.7
             end
             i32.const 255
             i32.and
             local.set $colorByte
             block $assembly/tms9918a/getRAMByte|inlined.8 (result i32)
              local.get $charPatternTable
              local.get $name
              i32.const 3
              i32.shl
              i32.add
              local.get $lineOffset
              i32.add
              local.set $addr|67
              global.get $assembly/tms9918a/vdpRAMAddr
              local.get $addr|67
              i32.add
              i32.load8_u
              br $assembly/tms9918a/getRAMByte|inlined.8
             end
             i32.const 255
             i32.and
             local.set $patternByte
             local.get $patternByte
             i32.const 128
             local.get $x1
             i32.const 7
             i32.and
             i32.shr_s
             i32.and
             i32.const 0
             i32.ne
             if (result i32)
              local.get $colorByte
              i32.const 240
              i32.and
              i32.const 4
              i32.shr_s
             else
              local.get $colorByte
              i32.const 15
              i32.and
             end
             local.set $color
             br $break|3
            end
            block $assembly/tms9918a/getRAMByte|inlined.9 (result i32)
             local.get $nameTable
             local.get $rowOffset
             i32.add
             local.get $x1
             i32.const 3
             i32.shr_s
             i32.add
             local.set $addr|68
             global.get $assembly/tms9918a/vdpRAMAddr
             local.get $addr|68
             i32.add
             i32.load8_u
             br $assembly/tms9918a/getRAMByte|inlined.9
            end
            i32.const 255
            i32.and
            local.set $name
            local.get $yScreen
            i32.const 192
            i32.and
            i32.const 5
            i32.shl
            local.get $name
            i32.const 3
            i32.shl
            i32.add
            local.set $tableOffset
            block $assembly/tms9918a/getRAMByte|inlined.10 (result i32)
             local.get $colorTable
             local.get $tableOffset
             local.get $colorTableMask
             i32.and
             i32.add
             local.get $lineOffset
             i32.add
             local.set $addr|69
             global.get $assembly/tms9918a/vdpRAMAddr
             local.get $addr|69
             i32.add
             i32.load8_u
             br $assembly/tms9918a/getRAMByte|inlined.10
            end
            i32.const 255
            i32.and
            local.set $colorByte
            block $assembly/tms9918a/getRAMByte|inlined.11 (result i32)
             local.get $charPatternTable
             local.get $tableOffset
             local.get $patternTableMask
             i32.and
             i32.add
             local.get $lineOffset
             i32.add
             local.set $addr|70
             global.get $assembly/tms9918a/vdpRAMAddr
             local.get $addr|70
             i32.add
             i32.load8_u
             br $assembly/tms9918a/getRAMByte|inlined.11
            end
            i32.const 255
            i32.and
            local.set $patternByte
            local.get $patternByte
            i32.const 128
            local.get $x1
            i32.const 7
            i32.and
            i32.shr_s
            i32.and
            i32.const 0
            i32.ne
            if (result i32)
             local.get $colorByte
             i32.const 240
             i32.and
             i32.const 4
             i32.shr_s
            else
             local.get $colorByte
             i32.const 15
             i32.and
            end
            local.set $color
            br $break|3
           end
           block $assembly/tms9918a/getRAMByte|inlined.12 (result i32)
            local.get $nameTable
            local.get $rowOffset
            i32.add
            local.get $x1
            i32.const 3
            i32.shr_s
            i32.add
            local.set $addr|71
            global.get $assembly/tms9918a/vdpRAMAddr
            local.get $addr|71
            i32.add
            i32.load8_u
            br $assembly/tms9918a/getRAMByte|inlined.12
           end
           i32.const 255
           i32.and
           local.set $name
           local.get $yScreen
           i32.const 28
           i32.and
           i32.const 2
           i32.shr_s
           local.set $lineOffset
           block $assembly/tms9918a/getRAMByte|inlined.13 (result i32)
            local.get $charPatternTable
            local.get $name
            i32.const 3
            i32.shl
            i32.add
            local.get $lineOffset
            i32.add
            local.set $addr|72
            global.get $assembly/tms9918a/vdpRAMAddr
            local.get $addr|72
            i32.add
            i32.load8_u
            br $assembly/tms9918a/getRAMByte|inlined.13
           end
           i32.const 255
           i32.and
           local.set $patternByte
           local.get $x1
           i32.const 4
           i32.and
           i32.const 0
           i32.eq
           if (result i32)
            local.get $patternByte
            i32.const 240
            i32.and
            i32.const 4
            i32.shr_s
           else
            local.get $patternByte
            i32.const 15
            i32.and
           end
           local.set $color
           br $break|3
          end
          block $assembly/tms9918a/getRAMByte|inlined.14 (result i32)
           local.get $nameTable
           local.get $rowOffset
           i32.add
           local.get $x1
           i32.const 6
           i32.div_s
           i32.add
           local.set $addr|73
           global.get $assembly/tms9918a/vdpRAMAddr
           local.get $addr|73
           i32.add
           i32.load8_u
           br $assembly/tms9918a/getRAMByte|inlined.14
          end
          i32.const 255
          i32.and
          local.set $name
          block $assembly/tms9918a/getRAMByte|inlined.15 (result i32)
           local.get $charPatternTable
           local.get $name
           i32.const 3
           i32.shl
           i32.add
           local.get $lineOffset
           i32.add
           local.set $addr|74
           global.get $assembly/tms9918a/vdpRAMAddr
           local.get $addr|74
           i32.add
           i32.load8_u
           br $assembly/tms9918a/getRAMByte|inlined.15
          end
          i32.const 255
          i32.and
          local.set $patternByte
          local.get $patternByte
          i32.const 128
          local.get $x1
          i32.const 6
          i32.rem_s
          i32.shr_s
          i32.and
          i32.const 0
          i32.ne
          if (result i32)
           local.get $fgColor
          else
           local.get $bgColor
          end
          local.set $color
          br $break|3
         end
         block $assembly/tms9918a/getRAMByte|inlined.16 (result i32)
          local.get $nameTable
          local.get $rowOffset
          i32.add
          local.get $x1
          i32.const 6
          i32.div_s
          i32.add
          local.set $addr|75
          global.get $assembly/tms9918a/vdpRAMAddr
          local.get $addr|75
          i32.add
          i32.load8_u
          br $assembly/tms9918a/getRAMByte|inlined.16
         end
         i32.const 255
         i32.and
         local.set $name
         local.get $yScreen
         i32.const 192
         i32.and
         i32.const 5
         i32.shl
         local.get $name
         i32.const 3
         i32.shl
         i32.add
         local.set $tableOffset
         block $assembly/tms9918a/getRAMByte|inlined.17 (result i32)
          local.get $charPatternTable
          local.get $tableOffset
          local.get $patternTableMask
          i32.and
          i32.add
          local.get $lineOffset
          i32.add
          local.set $addr|76
          global.get $assembly/tms9918a/vdpRAMAddr
          local.get $addr|76
          i32.add
          i32.load8_u
          br $assembly/tms9918a/getRAMByte|inlined.17
         end
         i32.const 255
         i32.and
         local.set $patternByte
         local.get $patternByte
         i32.const 128
         local.get $x1
         i32.const 6
         i32.rem_s
         i32.shr_s
         i32.and
         i32.const 0
         i32.ne
         if (result i32)
          local.get $fgColor
         else
          local.get $bgColor
         end
         local.set $color
         br $break|3
        end
        block $assembly/tms9918a/getRAMByte|inlined.18 (result i32)
         local.get $nameTable
         local.get $rowOffset
         i32.add
         local.get $x1
         i32.const 3
         i32.shr_s
         i32.add
         local.set $addr|77
         global.get $assembly/tms9918a/vdpRAMAddr
         local.get $addr|77
         i32.add
         i32.load8_u
         br $assembly/tms9918a/getRAMByte|inlined.18
        end
        i32.const 255
        i32.and
        local.set $name
        local.get $yScreen
        i32.const 28
        i32.and
        i32.const 2
        i32.shr_s
        local.set $lineOffset
        local.get $yScreen
        i32.const 192
        i32.and
        i32.const 5
        i32.shl
        local.get $name
        i32.const 3
        i32.shl
        i32.add
        local.set $tableOffset
        block $assembly/tms9918a/getRAMByte|inlined.19 (result i32)
         local.get $charPatternTable
         local.get $tableOffset
         local.get $patternTableMask
         i32.and
         i32.add
         local.get $lineOffset
         i32.add
         local.set $addr|78
         global.get $assembly/tms9918a/vdpRAMAddr
         local.get $addr|78
         i32.add
         i32.load8_u
         br $assembly/tms9918a/getRAMByte|inlined.19
        end
        i32.const 255
        i32.and
        local.set $patternByte
        local.get $x1
        i32.const 4
        i32.and
        i32.const 0
        i32.eq
        if (result i32)
         local.get $patternByte
         i32.const 240
         i32.and
         i32.const 4
         i32.shr_s
        else
         local.get $patternByte
         i32.const 15
         i32.and
        end
        local.set $color
        br $break|3
       end
       local.get $x1
       i32.const 4
       i32.and
       i32.const 0
       i32.eq
       if (result i32)
        local.get $fgColor
       else
        local.get $bgColor
       end
       local.set $color
       br $break|3
      end
      local.get $color
      i32.const 0
      i32.eq
      if
       local.get $bgColor
       local.set $color
      end
      local.get $textMode
      i32.eqz
      if
       block $assembly/tms9918a/getSpriteBuffer|inlined.1 (result i32)
        local.get $x1
        local.set $offset|79
        global.get $assembly/tms9918a/spriteBufferAddr
        local.get $offset|79
        i32.const 2
        i32.shl
        i32.add
        i32.load
        br $assembly/tms9918a/getSpriteBuffer|inlined.1
       end
       local.set $spriteColor
       local.get $spriteColor
       i32.const 0
       i32.gt_s
       if
        local.get $spriteColor
        local.set $color
       end
      end
     else
      local.get $bgColor
      local.set $color
     end
     block $assembly/tms9918a/getColor|inlined.0 (result i32)
      local.get $color
      local.set $i
      global.get $assembly/tms9918a/paletteAddr
      local.get $i
      i32.const 2
      i32.shl
      i32.add
      i32.load
      br $assembly/tms9918a/getColor|inlined.0
     end
     local.set $rgbColor
     local.get $imageDataAddr
     local.tee $82
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $82
     local.set $addr|83
     local.get $rgbColor
     local.set $value
     global.get $assembly/tms9918a/scanlineColorBufferAddr
     local.get $addr|83
     i32.const 2
     i32.shl
     i32.add
     local.get $value
     i32.store
     local.get $x
     i32.const 1
     i32.add
     local.set $x
     br $for-loop|2
    end
   end
  else
   block $assembly/tms9918a/getColor|inlined.1 (result i32)
    local.get $bgColor
    local.set $i|85
    global.get $assembly/tms9918a/paletteAddr
    local.get $i|85
    i32.const 2
    i32.shl
    i32.add
    i32.load
    br $assembly/tms9918a/getColor|inlined.1
   end
   local.set $rgbColor
   i32.const 0
   local.set $x
   loop $for-loop|4
    local.get $x
    local.get $width
    i32.lt_s
    if
     local.get $imageDataAddr
     local.tee $86
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $86
     local.set $addr|87
     local.get $rgbColor
     local.set $value|88
     global.get $assembly/tms9918a/scanlineColorBufferAddr
     local.get $addr|87
     i32.const 2
     i32.shl
     i32.add
     local.get $value|88
     i32.store
     local.get $x
     i32.const 1
     i32.add
     local.set $x
     br $for-loop|4
    end
   end
  end
  local.get $y
  local.get $vBorder
  i32.const 192
  i32.add
  i32.eq
  if
   local.get $statusRegister
   i32.const 128
   i32.or
   local.set $statusRegister
  end
  local.get $collision
  if
   local.get $statusRegister
   i32.const 32
   i32.or
   local.set $statusRegister
  end
  local.get $statusRegister
  i32.const 64
  i32.and
  i32.const 0
  i32.eq
  if
   local.get $statusRegister
   i32.const 224
   i32.and
   local.get $fifthSpriteIndex
   i32.or
   local.set $statusRegister
   local.get $fifthSprite
   if
    local.get $statusRegister
    i32.const 64
    i32.or
    local.set $statusRegister
   end
  end
  local.get $statusRegister
  i32.const 255
  i32.and
  return
 )
 (func $assembly/f18a/initSpriteBuffer (param $drawWidth i32)
  global.get $assembly/f18a/spriteColorBufferAddr
  i32.const 0
  local.get $drawWidth
  i32.const 2
  i32.shl
  memory.fill
  global.get $assembly/f18a/spritePaletteBaseIndexBufferAddr
  i32.const 0
  local.get $drawWidth
  i32.const 2
  i32.shl
  memory.fill
 )
 (func $assembly/f18a/setSpriteColorBuffer (param $offset i32) (param $value i32)
  global.get $assembly/f18a/spriteColorBufferAddr
  local.get $offset
  i32.const 2
  i32.shl
  i32.add
  local.get $value
  i32.store
 )
 (func $assembly/f18a/setSpritePaletteBaseIndexBuffer (param $offset i32) (param $value i32)
  global.get $assembly/f18a/spritePaletteBaseIndexBufferAddr
  local.get $offset
  i32.const 2
  i32.shl
  i32.add
  local.get $value
  i32.store
 )
 (func $assembly/f18a/prepareSprites (param $y i32) (param $drawWidth i32) (param $screenMode i32) (param $row30Enabled i32) (param $unlocked i32) (param $spriteLinkingEnabled i32) (param $realSpriteYCoord i32) (param $maxSprites i32) (param $maxScanlineSprites i32) (param $spriteColorMode i32) (param $spritePaletteSelect i32) (param $spritePlaneOffset i32) (param $defaultSpriteSize i32) (param $spriteMag i32) (param $spriteAttributeTable i32) (param $spritePatternTable i32) (param $statusRegister i32) (result i32)
  (local $spritesOnLine i32)
  (local $outOfScreenY i32)
  (local $negativeScreenY i32)
  (local $maxSpriteAttrAddr i32)
  (local $spriteAttrAddr i32)
  (local $index i32)
  (local $addr i32)
  (local $parentSpriteAttrAddr i32)
  (local $addr|25 i32)
  (local $spriteLinkingAttr i32)
  (local $addr|27 i32)
  (local $spriteY i32)
  (local $addr|29 i32)
  (local $addr|30 i32)
  (local $spriteAttr i32)
  (local $spriteSize i32)
  (local $spriteHeight i32)
  (local $spriteDimensionY i32)
  (local $spriteWidth i32)
  (local $spriteDimensionX i32)
  (local $addr|37 i32)
  (local $spriteX i32)
  (local $addr|39 i32)
  (local $addr|40 i32)
  (local $addr|41 i32)
  (local $patternNo i32)
  (local $spriteFlipY i32)
  (local $spriteFlipX i32)
  (local $baseColor i32)
  (local $sprPaletteBaseIndex i32)
  (local $47 i32)
  (local $spritePatternBaseAddr i32)
  (local $dy i32)
  (local $dx i32)
  (local $spritePatternAddr i32)
  (local $addr|52 i32)
  (local $spritePatternByte0 i32)
  (local $addr|54 i32)
  (local $spritePatternByte1 i32)
  (local $addr|56 i32)
  (local $spritePatternByte2 i32)
  (local $spriteBit i32)
  (local $spriteBitShift2 i32)
  (local $spriteBitShift1 i32)
  (local $sprColor i32)
  (local $pixelOn i32)
  (local $63 i32)
  (local $x2 i32)
  (local $offset i32)
  (local $offset|66 i32)
  (local $x1 i32)
  (local $offset|68 i32)
  (local $spriteColorBufferValue i32)
  (local $offset|70 i32)
  (local $spritePaletteBaseIndexBufferValue i32)
  local.get $drawWidth
  call $assembly/f18a/initSpriteBuffer
  i32.const 0
  local.set $spritesOnLine
  local.get $row30Enabled
  if (result i32)
   i32.const 240
  else
   i32.const 192
  end
  local.set $outOfScreenY
  local.get $row30Enabled
  if (result i32)
   i32.const 240
  else
   i32.const 208
  end
  local.set $negativeScreenY
  local.get $spriteAttributeTable
  local.get $maxSprites
  i32.const 2
  i32.shl
  i32.add
  local.set $maxSpriteAttrAddr
  local.get $spriteAttributeTable
  local.set $spriteAttrAddr
  i32.const 0
  local.set $index
  loop $for-loop|0
   local.get $row30Enabled
   if (result i32)
    i32.const 1
   else
    block $assembly/f18a/getRAMByte|inlined.0 (result i32)
     local.get $spriteAttrAddr
     local.set $addr
     global.get $assembly/f18a/vdpRAMAddr
     local.get $addr
     i32.add
     i32.load8_u
     br $assembly/f18a/getRAMByte|inlined.0
    end
    i32.const 255
    i32.and
    i32.const 208
    i32.ne
   end
   if (result i32)
    local.get $spriteAttrAddr
    local.get $maxSpriteAttrAddr
    i32.lt_s
   else
    i32.const 0
   end
   if (result i32)
    local.get $spritesOnLine
    local.get $maxScanlineSprites
    i32.le_s
   else
    i32.const 0
   end
   if
    i32.const -1
    local.set $parentSpriteAttrAddr
    local.get $spriteLinkingEnabled
    if
     block $assembly/f18a/getRAMByte|inlined.1 (result i32)
      local.get $spriteAttributeTable
      i32.const 128
      i32.add
      local.get $spriteAttrAddr
      local.get $spriteAttributeTable
      i32.sub
      i32.const 2
      i32.shr_s
      i32.add
      local.set $addr|25
      global.get $assembly/f18a/vdpRAMAddr
      local.get $addr|25
      i32.add
      i32.load8_u
      br $assembly/f18a/getRAMByte|inlined.1
     end
     i32.const 255
     i32.and
     local.set $spriteLinkingAttr
     local.get $spriteLinkingAttr
     i32.const 32
     i32.and
     i32.const 0
     i32.ne
     if
      local.get $spriteAttributeTable
      local.get $spriteLinkingAttr
      i32.const 31
      i32.and
      i32.const 2
      i32.shl
      i32.add
      local.set $parentSpriteAttrAddr
     end
    end
    block $assembly/f18a/getRAMByte|inlined.2 (result i32)
     local.get $spriteAttrAddr
     local.set $addr|27
     global.get $assembly/f18a/vdpRAMAddr
     local.get $addr|27
     i32.add
     i32.load8_u
     br $assembly/f18a/getRAMByte|inlined.2
    end
    i32.const 255
    i32.and
    local.set $spriteY
    local.get $parentSpriteAttrAddr
    i32.const -1
    i32.ne
    if
     local.get $spriteY
     block $assembly/f18a/getRAMByte|inlined.3 (result i32)
      local.get $parentSpriteAttrAddr
      local.set $addr|29
      global.get $assembly/f18a/vdpRAMAddr
      local.get $addr|29
      i32.add
      i32.load8_u
      br $assembly/f18a/getRAMByte|inlined.3
     end
     i32.const 255
     i32.and
     i32.add
     i32.const 255
     i32.and
     local.set $spriteY
    end
    local.get $realSpriteYCoord
    i32.eqz
    if
     local.get $spriteY
     i32.const 1
     i32.add
     local.set $spriteY
    end
    local.get $spriteY
    local.get $outOfScreenY
    i32.lt_s
    if (result i32)
     i32.const 1
    else
     local.get $spriteY
     local.get $negativeScreenY
     i32.gt_s
    end
    if
     local.get $spriteY
     local.get $negativeScreenY
     i32.gt_s
     if
      local.get $spriteY
      i32.const 256
      i32.sub
      local.set $spriteY
     end
     block $assembly/f18a/getRAMByte|inlined.4 (result i32)
      local.get $spriteAttrAddr
      i32.const 3
      i32.add
      local.set $addr|30
      global.get $assembly/f18a/vdpRAMAddr
      local.get $addr|30
      i32.add
      i32.load8_u
      br $assembly/f18a/getRAMByte|inlined.4
     end
     i32.const 255
     i32.and
     local.set $spriteAttr
     local.get $unlocked
     i32.eqz
     if (result i32)
      i32.const 1
     else
      local.get $spriteAttr
      i32.const 16
      i32.and
      i32.const 0
      i32.eq
     end
     if (result i32)
      local.get $defaultSpriteSize
     else
      i32.const 1
     end
     local.set $spriteSize
     i32.const 8
     local.get $spriteSize
     i32.shl
     local.set $spriteHeight
     local.get $spriteHeight
     local.get $spriteMag
     i32.shl
     local.set $spriteDimensionY
     local.get $y
     local.get $spriteY
     i32.ge_s
     if (result i32)
      local.get $y
      local.get $spriteY
      local.get $spriteDimensionY
      i32.add
      i32.lt_s
     else
      i32.const 0
     end
     if
      local.get $spritesOnLine
      local.get $maxScanlineSprites
      i32.lt_s
      if
       local.get $spriteHeight
       local.set $spriteWidth
       local.get $spriteDimensionY
       local.set $spriteDimensionX
       block $assembly/f18a/getRAMByte|inlined.5 (result i32)
        local.get $spriteAttrAddr
        i32.const 1
        i32.add
        local.set $addr|37
        global.get $assembly/f18a/vdpRAMAddr
        local.get $addr|37
        i32.add
        i32.load8_u
        br $assembly/f18a/getRAMByte|inlined.5
       end
       i32.const 255
       i32.and
       local.set $spriteX
       local.get $parentSpriteAttrAddr
       i32.const -1
       i32.eq
       if
        local.get $spriteAttr
        i32.const 128
        i32.and
        i32.const 0
        i32.ne
        if
         local.get $spriteX
         i32.const 32
         i32.sub
         local.set $spriteX
        end
       else
        local.get $spriteX
        block $assembly/f18a/getRAMByte|inlined.6 (result i32)
         local.get $parentSpriteAttrAddr
         i32.const 1
         i32.add
         local.set $addr|39
         global.get $assembly/f18a/vdpRAMAddr
         local.get $addr|39
         i32.add
         i32.load8_u
         br $assembly/f18a/getRAMByte|inlined.6
        end
        i32.const 255
        i32.and
        i32.add
        i32.const 255
        i32.and
        local.set $spriteX
        block $assembly/f18a/getRAMByte|inlined.7 (result i32)
         local.get $parentSpriteAttrAddr
         i32.const 3
         i32.add
         local.set $addr|40
         global.get $assembly/f18a/vdpRAMAddr
         local.get $addr|40
         i32.add
         i32.load8_u
         br $assembly/f18a/getRAMByte|inlined.7
        end
        i32.const 128
        i32.and
        i32.const 0
        i32.ne
        if
         local.get $spriteX
         i32.const 32
         i32.sub
         local.set $spriteX
        end
       end
       block $assembly/f18a/getRAMByte|inlined.8 (result i32)
        local.get $spriteAttrAddr
        i32.const 2
        i32.add
        local.set $addr|41
        global.get $assembly/f18a/vdpRAMAddr
        local.get $addr|41
        i32.add
        i32.load8_u
        br $assembly/f18a/getRAMByte|inlined.8
       end
       local.get $spriteSize
       i32.const 0
       i32.ne
       if (result i32)
        i32.const 252
       else
        i32.const 255
       end
       i32.and
       local.set $patternNo
       local.get $unlocked
       if (result i32)
        local.get $spriteAttr
        i32.const 32
        i32.and
        i32.const 0
        i32.ne
       else
        i32.const 0
       end
       local.set $spriteFlipY
       local.get $unlocked
       if (result i32)
        local.get $spriteAttr
        i32.const 64
        i32.and
        i32.const 0
        i32.ne
       else
        i32.const 0
       end
       local.set $spriteFlipX
       local.get $spriteAttr
       i32.const 15
       i32.and
       local.set $baseColor
       i32.const 0
       local.set $sprPaletteBaseIndex
       block $break|1
        block $case3|1
         block $case2|1
          block $case1|1
           block $case0|1
            local.get $spriteColorMode
            local.set $47
            local.get $47
            global.get $assembly/f18a/COLOR_MODE_NORMAL
            i32.eq
            br_if $case0|1
            local.get $47
            global.get $assembly/f18a/COLOR_MODE_ECM_1
            i32.eq
            br_if $case1|1
            local.get $47
            global.get $assembly/f18a/COLOR_MODE_ECM_2
            i32.eq
            br_if $case2|1
            local.get $47
            global.get $assembly/f18a/COLOR_MODE_ECM_3
            i32.eq
            br_if $case3|1
            br $break|1
           end
           local.get $spritePaletteSelect
           local.set $sprPaletteBaseIndex
           br $break|1
          end
          local.get $spritePaletteSelect
          i32.const 32
          i32.and
          local.get $baseColor
          i32.const 1
          i32.shl
          i32.or
          local.set $sprPaletteBaseIndex
          br $break|1
         end
         local.get $baseColor
         i32.const 2
         i32.shl
         local.set $sprPaletteBaseIndex
         br $break|1
        end
        local.get $baseColor
        i32.const 14
        i32.and
        i32.const 2
        i32.shl
        local.set $sprPaletteBaseIndex
        br $break|1
       end
       local.get $spritePatternTable
       local.get $patternNo
       i32.const 3
       i32.shl
       i32.add
       local.set $spritePatternBaseAddr
       local.get $y
       local.get $spriteY
       i32.sub
       local.get $spriteMag
       i32.shr_s
       local.set $dy
       local.get $spriteFlipY
       if
        local.get $spriteHeight
        local.get $dy
        i32.sub
        i32.const 1
        i32.sub
        local.set $dy
       end
       i32.const 0
       local.set $dx
       loop $for-loop|2
        local.get $dx
        local.get $spriteWidth
        i32.lt_s
        if
         local.get $spritePatternBaseAddr
         local.get $dy
         i32.add
         local.get $dx
         i32.const 1
         i32.shl
         i32.add
         local.set $spritePatternAddr
         block $assembly/f18a/getRAMByte|inlined.9 (result i32)
          local.get $spritePatternAddr
          local.set $addr|52
          global.get $assembly/f18a/vdpRAMAddr
          local.get $addr|52
          i32.add
          i32.load8_u
          br $assembly/f18a/getRAMByte|inlined.9
         end
         i32.const 255
         i32.and
         local.set $spritePatternByte0
         block $assembly/f18a/getRAMByte|inlined.10 (result i32)
          local.get $spritePatternAddr
          local.get $spritePlaneOffset
          i32.add
          i32.const 16383
          i32.and
          local.set $addr|54
          global.get $assembly/f18a/vdpRAMAddr
          local.get $addr|54
          i32.add
          i32.load8_u
          br $assembly/f18a/getRAMByte|inlined.10
         end
         i32.const 255
         i32.and
         local.set $spritePatternByte1
         block $assembly/f18a/getRAMByte|inlined.11 (result i32)
          local.get $spritePatternAddr
          local.get $spritePlaneOffset
          i32.const 1
          i32.shl
          i32.add
          i32.const 16383
          i32.and
          local.set $addr|56
          global.get $assembly/f18a/vdpRAMAddr
          local.get $addr|56
          i32.add
          i32.load8_u
          br $assembly/f18a/getRAMByte|inlined.11
         end
         i32.const 255
         i32.and
         local.set $spritePatternByte2
         i32.const 128
         local.set $spriteBit
         i32.const 7
         local.set $spriteBitShift2
         i32.const 0
         local.set $spriteBitShift1
         loop $for-loop|3
          local.get $spriteBitShift1
          i32.const 8
          i32.lt_s
          if
           i32.const 0
           local.set $sprColor
           i32.const 0
           local.set $pixelOn
           block $break|4
            block $case3|4
             block $case2|4
              block $case1|4
               block $case0|4
                local.get $spriteColorMode
                local.set $63
                local.get $63
                global.get $assembly/f18a/COLOR_MODE_NORMAL
                i32.eq
                br_if $case0|4
                local.get $63
                global.get $assembly/f18a/COLOR_MODE_ECM_1
                i32.eq
                br_if $case1|4
                local.get $63
                global.get $assembly/f18a/COLOR_MODE_ECM_2
                i32.eq
                br_if $case2|4
                local.get $63
                global.get $assembly/f18a/COLOR_MODE_ECM_3
                i32.eq
                br_if $case3|4
                br $break|4
               end
               local.get $spritePatternByte0
               local.get $spriteBit
               i32.and
               i32.const 0
               i32.ne
               local.set $pixelOn
               local.get $pixelOn
               if (result i32)
                local.get $baseColor
               else
                i32.const 0
               end
               local.set $sprColor
               br $break|4
              end
              local.get $spritePatternByte0
              local.get $spriteBit
              i32.and
              local.get $spriteBitShift2
              i32.shr_s
              local.set $sprColor
              br $break|4
             end
             local.get $spritePatternByte0
             local.get $spriteBit
             i32.and
             local.get $spriteBitShift2
             i32.shr_s
             local.get $spritePatternByte1
             local.get $spriteBit
             i32.and
             local.get $spriteBitShift2
             i32.shr_s
             i32.const 1
             i32.shl
             i32.or
             local.set $sprColor
             br $break|4
            end
            local.get $spritePatternByte0
            local.get $spriteBit
            i32.and
            local.get $spriteBitShift2
            i32.shr_s
            local.get $spritePatternByte1
            local.get $spriteBit
            i32.and
            local.get $spriteBitShift2
            i32.shr_s
            i32.const 1
            i32.shl
            i32.or
            local.get $spritePatternByte2
            local.get $spriteBit
            i32.and
            local.get $spriteBitShift2
            i32.shr_s
            i32.const 2
            i32.shl
            i32.or
            local.set $sprColor
            br $break|4
           end
           local.get $sprColor
           i32.const 0
           i32.gt_s
           if (result i32)
            i32.const 1
           else
            local.get $pixelOn
           end
           if
            local.get $spriteX
            local.get $spriteFlipX
            if (result i32)
             local.get $spriteDimensionX
             local.get $dx
             local.get $spriteBitShift1
             i32.add
             i32.const 1
             i32.add
             local.get $spriteMag
             i32.shl
             i32.sub
            else
             local.get $dx
             local.get $spriteBitShift1
             i32.add
             local.get $spriteMag
             i32.shl
            end
            i32.add
            local.set $x2
            local.get $x2
            i32.const 0
            i32.ge_s
            if (result i32)
             local.get $x2
             local.get $drawWidth
             i32.lt_s
            else
             i32.const 0
            end
            if
             block $assembly/f18a/getSpriteColorBuffer|inlined.0 (result i32)
              local.get $x2
              local.set $offset
              global.get $assembly/f18a/spriteColorBufferAddr
              local.get $offset
              i32.const 2
              i32.shl
              i32.add
              i32.load
              br $assembly/f18a/getSpriteColorBuffer|inlined.0
             end
             i32.const 0
             i32.eq
             if
              local.get $x2
              local.get $sprColor
              i32.const 1
              i32.add
              call $assembly/f18a/setSpriteColorBuffer
              local.get $x2
              local.get $sprPaletteBaseIndex
              call $assembly/f18a/setSpritePaletteBaseIndexBuffer
             else
              local.get $statusRegister
              i32.const 32
              i32.or
              local.set $statusRegister
             end
            end
            local.get $spriteMag
            if
             local.get $x2
             i32.const 1
             i32.add
             local.set $x2
             local.get $x2
             i32.const 0
             i32.ge_s
             if (result i32)
              local.get $x2
              local.get $drawWidth
              i32.lt_s
             else
              i32.const 0
             end
             if
              block $assembly/f18a/getSpriteColorBuffer|inlined.1 (result i32)
               local.get $x2
               local.set $offset|66
               global.get $assembly/f18a/spriteColorBufferAddr
               local.get $offset|66
               i32.const 2
               i32.shl
               i32.add
               i32.load
               br $assembly/f18a/getSpriteColorBuffer|inlined.1
              end
              i32.const 0
              i32.eq
              if
               local.get $x2
               local.get $sprColor
               i32.const 1
               i32.add
               call $assembly/f18a/setSpriteColorBuffer
               local.get $x2
               local.get $sprPaletteBaseIndex
               call $assembly/f18a/setSpritePaletteBaseIndexBuffer
              else
               local.get $statusRegister
               i32.const 32
               i32.or
               local.set $statusRegister
              end
             end
            end
           end
           local.get $spriteBit
           i32.const 1
           i32.shr_s
           local.set $spriteBit
           local.get $spriteBitShift2
           i32.const 1
           i32.sub
           local.set $spriteBitShift2
           local.get $spriteBitShift1
           i32.const 1
           i32.add
           local.set $spriteBitShift1
           br $for-loop|3
          end
         end
         local.get $dx
         i32.const 8
         i32.add
         local.set $dx
         br $for-loop|2
        end
       end
      end
      local.get $spritesOnLine
      i32.const 1
      i32.add
      local.set $spritesOnLine
      local.get $spritesOnLine
      i32.const 5
      i32.eq
      if (result i32)
       local.get $statusRegister
       i32.const 64
       i32.and
       i32.const 0
       i32.eq
      else
       i32.const 0
      end
      if
       local.get $statusRegister
       i32.const 64
       i32.or
       local.set $statusRegister
       local.get $statusRegister
       i32.const 224
       i32.and
       local.get $index
       i32.or
       local.set $statusRegister
      end
     end
    end
    local.get $spriteAttrAddr
    i32.const 4
    i32.add
    local.set $spriteAttrAddr
    local.get $index
    i32.const 1
    i32.add
    local.set $index
    br $for-loop|0
   end
  end
  local.get $screenMode
  global.get $assembly/f18a/MODE_TEXT_80
  i32.eq
  if
   local.get $drawWidth
   i32.const 1
   i32.shr_s
   local.set $x1
   loop $for-loop|5
    local.get $x1
    i32.const 0
    i32.ge_s
    if
     block $assembly/f18a/getSpriteColorBuffer|inlined.2 (result i32)
      local.get $x1
      local.set $offset|68
      global.get $assembly/f18a/spriteColorBufferAddr
      local.get $offset|68
      i32.const 2
      i32.shl
      i32.add
      i32.load
      br $assembly/f18a/getSpriteColorBuffer|inlined.2
     end
     local.set $spriteColorBufferValue
     block $assembly/f18a/getSpritePaletteBaseIndexBuffer|inlined.0 (result i32)
      local.get $x1
      local.set $offset|70
      global.get $assembly/f18a/spritePaletteBaseIndexBufferAddr
      local.get $offset|70
      i32.const 2
      i32.shl
      i32.add
      i32.load
      br $assembly/f18a/getSpritePaletteBaseIndexBuffer|inlined.0
     end
     local.set $spritePaletteBaseIndexBufferValue
     local.get $x1
     i32.const 1
     i32.shl
     local.get $spriteColorBufferValue
     call $assembly/f18a/setSpriteColorBuffer
     local.get $x1
     i32.const 1
     i32.shl
     local.get $spritePaletteBaseIndexBufferValue
     call $assembly/f18a/setSpritePaletteBaseIndexBuffer
     local.get $x1
     i32.const 1
     i32.shl
     i32.const 1
     i32.add
     local.get $spriteColorBufferValue
     call $assembly/f18a/setSpriteColorBuffer
     local.get $x1
     i32.const 1
     i32.shl
     i32.const 1
     i32.add
     local.get $spritePaletteBaseIndexBufferValue
     call $assembly/f18a/setSpritePaletteBaseIndexBuffer
     local.get $x1
     i32.const 1
     i32.sub
     local.set $x1
     br $for-loop|5
    end
   end
  end
  local.get $statusRegister
  return
 )
 (func $assembly/f18a/drawTileLayer (param $x i32) (param $y i32) (param $y1 i32) (param $rowOffset i32) (param $lineOffset i32) (param $nameTableCanonicalBase i32) (param $nameTableBaseAddr i32) (param $colorTable i32) (param $borderWidth i32) (param $scrollWidth i32) (param $hScroll i32) (param $hPageSize i32) (param $tilePaletteSelect i32) (param $screenMode i32) (param $tileColorMode i32) (param $unlocked i32) (param $ecmPositionAttributes i32) (param $charPatternTable i32) (param $tilePlaneOffset i32) (param $patternTableMask i32) (param $colorTableMask i32) (param $drawWidth i32) (param $fgColor i32) (param $bgColor i32)
  (local $tilePriority i32)
  (local $transparentColor0 i32)
  (local $tileColor i32)
  (local $paletteBaseIndex i32)
  (local $nameTableAddr i32)
  (local $x1 i32)
  (local $charNo i32)
  (local $bitShift i32)
  (local $bit i32)
  (local $patternAddr i32)
  (local $patternByte i32)
  (local $colorByte i32)
  (local $tileAttributeByte i32)
  (local $tilePaletteBaseIndex i32)
  (local $lineOffset1 i32)
  (local $39 i32)
  (local $addr i32)
  (local $addr|41 i32)
  (local $addr|42 i32)
  (local $43 i32)
  (local $addr|44 i32)
  (local $colorSet i32)
  (local $addr|46 i32)
  (local $addr|47 i32)
  (local $addr|48 i32)
  (local $addr|49 i32)
  (local $charSetOffset i32)
  (local $addr|51 i32)
  (local $colorAddr i32)
  (local $addr|53 i32)
  (local $addr|54 i32)
  (local $addr|55 i32)
  (local $addr|56 i32)
  (local $57 i32)
  (local $addr|58 i32)
  (local $addr|59 i32)
  (local $addr|60 i32)
  (local $addr|61 i32)
  (local $addr|62 i32)
  (local $addr|63 i32)
  i32.const 0
  local.set $tilePriority
  i32.const 0
  local.set $transparentColor0
  i32.const 0
  local.set $tileColor
  i32.const 0
  local.set $paletteBaseIndex
  local.get $nameTableBaseAddr
  local.set $nameTableAddr
  local.get $x
  local.get $borderWidth
  i32.sub
  local.get $hScroll
  local.get $screenMode
  global.get $assembly/f18a/MODE_TEXT_80
  i32.eq
  if (result i32)
   i32.const 1
  else
   i32.const 0
  end
  i32.shl
  i32.add
  local.set $x1
  local.get $x1
  local.get $scrollWidth
  i32.ge_s
  if
   local.get $x1
   local.get $scrollWidth
   i32.sub
   local.set $x1
   local.get $nameTableAddr
   local.get $hPageSize
   i32.xor
   local.set $nameTableAddr
  end
  i32.const 0
  local.set $colorByte
  i32.const 0
  local.set $tileAttributeByte
  i32.const 0
  local.set $tilePaletteBaseIndex
  block $break|0
   block $case4|0
    block $case3|0
     block $case2|0
      block $case1|0
       block $case0|0
        local.get $screenMode
        local.set $39
        local.get $39
        global.get $assembly/f18a/MODE_GRAPHICS
        i32.eq
        br_if $case0|0
        local.get $39
        global.get $assembly/f18a/MODE_BITMAP
        i32.eq
        br_if $case1|0
        local.get $39
        global.get $assembly/f18a/MODE_TEXT
        i32.eq
        br_if $case2|0
        local.get $39
        global.get $assembly/f18a/MODE_TEXT_80
        i32.eq
        br_if $case3|0
        local.get $39
        global.get $assembly/f18a/MODE_MULTICOLOR
        i32.eq
        br_if $case4|0
        br $break|0
       end
       local.get $nameTableAddr
       local.get $x1
       i32.const 3
       i32.shr_s
       local.get $rowOffset
       i32.add
       i32.add
       local.set $nameTableAddr
       block $assembly/f18a/getRAMByte|inlined.12 (result i32)
        local.get $nameTableAddr
        local.set $addr
        global.get $assembly/f18a/vdpRAMAddr
        local.get $addr
        i32.add
        i32.load8_u
        br $assembly/f18a/getRAMByte|inlined.12
       end
       i32.const 255
       i32.and
       local.set $charNo
       local.get $x1
       i32.const 7
       i32.and
       local.set $bitShift
       local.get $lineOffset
       local.set $lineOffset1
       local.get $tileColorMode
       global.get $assembly/f18a/COLOR_MODE_NORMAL
       i32.ne
       if
        block $assembly/f18a/getRAMByte|inlined.13 (result i32)
         local.get $colorTable
         local.get $ecmPositionAttributes
         if (result i32)
          local.get $nameTableAddr
          local.get $nameTableCanonicalBase
          i32.sub
         else
          local.get $charNo
         end
         i32.add
         local.set $addr|41
         global.get $assembly/f18a/vdpRAMAddr
         local.get $addr|41
         i32.add
         i32.load8_u
         br $assembly/f18a/getRAMByte|inlined.13
        end
        i32.const 255
        i32.and
        local.set $tileAttributeByte
        local.get $tileAttributeByte
        i32.const 128
        i32.and
        i32.const 0
        i32.ne
        local.set $tilePriority
        local.get $tileAttributeByte
        i32.const 64
        i32.and
        i32.const 0
        i32.ne
        if
         i32.const 7
         local.get $bitShift
         i32.sub
         local.set $bitShift
        end
        local.get $tileAttributeByte
        i32.const 32
        i32.and
        i32.const 0
        i32.ne
        if
         i32.const 7
         local.get $lineOffset1
         i32.sub
         local.set $lineOffset1
        end
        local.get $tileAttributeByte
        i32.const 16
        i32.and
        i32.const 0
        i32.ne
        local.set $transparentColor0
       end
       i32.const 128
       local.get $bitShift
       i32.shr_s
       local.set $bit
       local.get $charPatternTable
       local.get $charNo
       i32.const 3
       i32.shl
       i32.add
       local.get $lineOffset1
       i32.add
       local.set $patternAddr
       block $assembly/f18a/getRAMByte|inlined.14 (result i32)
        local.get $patternAddr
        local.set $addr|42
        global.get $assembly/f18a/vdpRAMAddr
        local.get $addr|42
        i32.add
        i32.load8_u
        br $assembly/f18a/getRAMByte|inlined.14
       end
       i32.const 255
       i32.and
       local.set $patternByte
       block $break|1
        block $case3|1
         block $case2|1
          block $case1|1
           block $case0|1
            local.get $tileColorMode
            local.set $43
            local.get $43
            global.get $assembly/f18a/COLOR_MODE_NORMAL
            i32.eq
            br_if $case0|1
            local.get $43
            global.get $assembly/f18a/COLOR_MODE_ECM_1
            i32.eq
            br_if $case1|1
            local.get $43
            global.get $assembly/f18a/COLOR_MODE_ECM_2
            i32.eq
            br_if $case2|1
            local.get $43
            global.get $assembly/f18a/COLOR_MODE_ECM_3
            i32.eq
            br_if $case3|1
            br $break|1
           end
           block $assembly/f18a/getRAMByte|inlined.15 (result i32)
            local.get $colorTable
            local.get $charNo
            i32.const 3
            i32.shr_s
            i32.add
            local.set $addr|44
            global.get $assembly/f18a/vdpRAMAddr
            local.get $addr|44
            i32.add
            i32.load8_u
            br $assembly/f18a/getRAMByte|inlined.15
           end
           i32.const 255
           i32.and
           local.set $colorSet
           local.get $patternByte
           local.get $bit
           i32.and
           i32.const 0
           i32.ne
           if (result i32)
            local.get $colorSet
            i32.const 240
            i32.and
            i32.const 4
            i32.shr_s
           else
            local.get $colorSet
            i32.const 15
            i32.and
           end
           local.set $tileColor
           local.get $tilePaletteSelect
           local.set $tilePaletteBaseIndex
           i32.const 1
           local.set $transparentColor0
           i32.const 0
           local.set $tilePriority
           br $break|1
          end
          local.get $patternByte
          local.get $bit
          i32.and
          i32.const 7
          local.get $bitShift
          i32.sub
          i32.shr_s
          local.set $tileColor
          local.get $tilePaletteSelect
          i32.const 32
          i32.and
          local.get $tileAttributeByte
          i32.const 15
          i32.and
          i32.const 1
          i32.shl
          i32.or
          local.set $tilePaletteBaseIndex
          br $break|1
         end
         local.get $patternByte
         local.get $bit
         i32.and
         i32.const 7
         local.get $bitShift
         i32.sub
         i32.shr_s
         block $assembly/f18a/getRAMByte|inlined.16 (result i32)
          local.get $patternAddr
          local.get $tilePlaneOffset
          i32.add
          i32.const 16383
          i32.and
          local.set $addr|46
          global.get $assembly/f18a/vdpRAMAddr
          local.get $addr|46
          i32.add
          i32.load8_u
          br $assembly/f18a/getRAMByte|inlined.16
         end
         i32.const 255
         i32.and
         local.get $bit
         i32.and
         i32.const 7
         local.get $bitShift
         i32.sub
         i32.shr_s
         i32.const 1
         i32.shl
         i32.or
         local.set $tileColor
         local.get $tileAttributeByte
         i32.const 15
         i32.and
         i32.const 2
         i32.shl
         local.set $tilePaletteBaseIndex
         br $break|1
        end
        local.get $patternByte
        local.get $bit
        i32.and
        i32.const 7
        local.get $bitShift
        i32.sub
        i32.shr_s
        block $assembly/f18a/getRAMByte|inlined.17 (result i32)
         local.get $patternAddr
         local.get $tilePlaneOffset
         i32.add
         i32.const 16383
         i32.and
         local.set $addr|47
         global.get $assembly/f18a/vdpRAMAddr
         local.get $addr|47
         i32.add
         i32.load8_u
         br $assembly/f18a/getRAMByte|inlined.17
        end
        i32.const 255
        i32.and
        local.get $bit
        i32.and
        i32.const 7
        local.get $bitShift
        i32.sub
        i32.shr_s
        i32.const 1
        i32.shl
        i32.or
        block $assembly/f18a/getRAMByte|inlined.18 (result i32)
         local.get $patternAddr
         local.get $tilePlaneOffset
         i32.const 1
         i32.shl
         i32.add
         i32.const 16383
         i32.and
         local.set $addr|48
         global.get $assembly/f18a/vdpRAMAddr
         local.get $addr|48
         i32.add
         i32.load8_u
         br $assembly/f18a/getRAMByte|inlined.18
        end
        i32.const 255
        i32.and
        local.get $bit
        i32.and
        i32.const 7
        local.get $bitShift
        i32.sub
        i32.shr_s
        i32.const 2
        i32.shl
        i32.or
        local.set $tileColor
        local.get $tileAttributeByte
        i32.const 14
        i32.and
        i32.const 2
        i32.shl
        local.set $tilePaletteBaseIndex
        br $break|1
       end
       local.get $tilePaletteBaseIndex
       local.set $paletteBaseIndex
       br $break|0
      end
      block $assembly/f18a/getRAMByte|inlined.19 (result i32)
       local.get $nameTableAddr
       local.get $x1
       i32.const 3
       i32.shr_s
       i32.add
       local.get $rowOffset
       i32.add
       local.set $addr|49
       global.get $assembly/f18a/vdpRAMAddr
       local.get $addr|49
       i32.add
       i32.load8_u
       br $assembly/f18a/getRAMByte|inlined.19
      end
      i32.const 255
      i32.and
      local.set $charNo
      local.get $x1
      i32.const 7
      i32.and
      local.set $bitShift
      i32.const 128
      local.get $bitShift
      i32.shr_s
      local.set $bit
      local.get $y
      i32.const 192
      i32.and
      i32.const 5
      i32.shl
      local.set $charSetOffset
      block $assembly/f18a/getRAMByte|inlined.20 (result i32)
       local.get $charPatternTable
       local.get $charNo
       i32.const 3
       i32.shl
       local.get $charSetOffset
       i32.add
       local.get $patternTableMask
       i32.and
       i32.add
       local.get $lineOffset
       i32.add
       local.set $addr|51
       global.get $assembly/f18a/vdpRAMAddr
       local.get $addr|51
       i32.add
       i32.load8_u
       br $assembly/f18a/getRAMByte|inlined.20
      end
      i32.const 255
      i32.and
      local.set $patternByte
      local.get $colorTable
      local.get $charNo
      i32.const 3
      i32.shl
      local.get $charSetOffset
      i32.add
      local.get $colorTableMask
      i32.and
      i32.add
      local.get $lineOffset
      i32.add
      local.set $colorAddr
      block $assembly/f18a/getRAMByte|inlined.21 (result i32)
       local.get $colorAddr
       local.set $addr|53
       global.get $assembly/f18a/vdpRAMAddr
       local.get $addr|53
       i32.add
       i32.load8_u
       br $assembly/f18a/getRAMByte|inlined.21
      end
      i32.const 255
      i32.and
      local.set $colorByte
      local.get $patternByte
      local.get $bit
      i32.and
      i32.const 0
      i32.ne
      if (result i32)
       local.get $colorByte
       i32.const 240
       i32.and
       i32.const 4
       i32.shr_s
      else
       local.get $colorByte
       i32.const 15
       i32.and
      end
      local.set $tileColor
      local.get $tilePaletteSelect
      local.set $paletteBaseIndex
      i32.const 1
      local.set $transparentColor0
      br $break|0
     end
    end
    local.get $x
    local.get $borderWidth
    i32.ge_s
    if (result i32)
     local.get $x
     local.get $drawWidth
     local.get $borderWidth
     i32.sub
     i32.lt_s
    else
     i32.const 0
    end
    if
     local.get $nameTableAddr
     local.get $x1
     i32.const 6
     i32.div_s
     local.get $rowOffset
     i32.add
     i32.add
     local.set $nameTableAddr
     block $assembly/f18a/getRAMByte|inlined.22 (result i32)
      local.get $nameTableAddr
      local.set $addr|54
      global.get $assembly/f18a/vdpRAMAddr
      local.get $addr|54
      i32.add
      i32.load8_u
      br $assembly/f18a/getRAMByte|inlined.22
     end
     i32.const 255
     i32.and
     local.set $charNo
     local.get $x1
     i32.const 6
     i32.rem_s
     local.set $bitShift
     local.get $lineOffset
     local.set $lineOffset1
     local.get $tileColorMode
     global.get $assembly/f18a/COLOR_MODE_NORMAL
     i32.ne
     if
      block $assembly/f18a/getRAMByte|inlined.23 (result i32)
       local.get $colorTable
       local.get $ecmPositionAttributes
       if (result i32)
        local.get $nameTableAddr
        local.get $nameTableCanonicalBase
        i32.sub
       else
        local.get $charNo
       end
       i32.add
       local.set $addr|55
       global.get $assembly/f18a/vdpRAMAddr
       local.get $addr|55
       i32.add
       i32.load8_u
       br $assembly/f18a/getRAMByte|inlined.23
      end
      i32.const 255
      i32.and
      local.set $tileAttributeByte
      local.get $tileAttributeByte
      i32.const 128
      i32.and
      i32.const 0
      i32.ne
      local.set $tilePriority
      local.get $tileAttributeByte
      i32.const 64
      i32.and
      i32.const 0
      i32.ne
      if
       i32.const 5
       local.get $bitShift
       i32.sub
       local.set $bitShift
      end
      local.get $tileAttributeByte
      i32.const 32
      i32.and
      i32.const 0
      i32.ne
      if
       i32.const 7
       local.get $lineOffset1
       i32.sub
       local.set $lineOffset1
      end
      local.get $tileAttributeByte
      i32.const 16
      i32.and
      i32.const 0
      i32.ne
      local.set $transparentColor0
     end
     i32.const 128
     local.get $bitShift
     i32.shr_s
     local.set $bit
     local.get $charPatternTable
     local.get $charNo
     i32.const 3
     i32.shl
     i32.add
     local.get $lineOffset1
     i32.add
     local.set $patternAddr
     block $assembly/f18a/getRAMByte|inlined.24 (result i32)
      local.get $patternAddr
      local.set $addr|56
      global.get $assembly/f18a/vdpRAMAddr
      local.get $addr|56
      i32.add
      i32.load8_u
      br $assembly/f18a/getRAMByte|inlined.24
     end
     i32.const 255
     i32.and
     local.set $patternByte
     block $break|2
      block $case3|2
       block $case2|2
        block $case1|2
         block $case0|2
          local.get $tileColorMode
          local.set $57
          local.get $57
          global.get $assembly/f18a/COLOR_MODE_NORMAL
          i32.eq
          br_if $case0|2
          local.get $57
          global.get $assembly/f18a/COLOR_MODE_ECM_1
          i32.eq
          br_if $case1|2
          local.get $57
          global.get $assembly/f18a/COLOR_MODE_ECM_2
          i32.eq
          br_if $case2|2
          local.get $57
          global.get $assembly/f18a/COLOR_MODE_ECM_3
          i32.eq
          br_if $case3|2
          br $break|2
         end
         local.get $unlocked
         if (result i32)
          local.get $ecmPositionAttributes
         else
          i32.const 0
         end
         if
          block $assembly/f18a/getRAMByte|inlined.25 (result i32)
           local.get $colorTable
           local.get $nameTableAddr
           i32.add
           local.get $nameTableCanonicalBase
           i32.sub
           local.set $addr|58
           global.get $assembly/f18a/vdpRAMAddr
           local.get $addr|58
           i32.add
           i32.load8_u
           br $assembly/f18a/getRAMByte|inlined.25
          end
          i32.const 255
          i32.and
          local.set $tileAttributeByte
          local.get $patternByte
          local.get $bit
          i32.and
          i32.const 0
          i32.ne
          if (result i32)
           local.get $tileAttributeByte
           i32.const 4
           i32.shr_s
          else
           local.get $tileAttributeByte
           i32.const 15
           i32.and
          end
          local.set $tileColor
         else
          local.get $patternByte
          local.get $bit
          i32.and
          i32.const 0
          i32.ne
          if (result i32)
           local.get $fgColor
          else
           local.get $bgColor
          end
          local.set $tileColor
         end
         local.get $tilePaletteSelect
         local.set $tilePaletteBaseIndex
         i32.const 1
         local.set $transparentColor0
         i32.const 0
         local.set $tilePriority
         br $break|2
        end
        local.get $patternByte
        local.get $bit
        i32.and
        i32.const 7
        local.get $bitShift
        i32.sub
        i32.shr_s
        local.set $tileColor
        local.get $tilePaletteSelect
        i32.const 32
        i32.and
        local.get $tileAttributeByte
        i32.const 15
        i32.and
        i32.const 1
        i32.shl
        i32.or
        local.set $tilePaletteBaseIndex
        br $break|2
       end
       local.get $patternByte
       local.get $bit
       i32.and
       i32.const 7
       local.get $bitShift
       i32.sub
       i32.shr_s
       block $assembly/f18a/getRAMByte|inlined.26 (result i32)
        local.get $patternAddr
        local.get $tilePlaneOffset
        i32.add
        i32.const 16383
        i32.and
        local.set $addr|59
        global.get $assembly/f18a/vdpRAMAddr
        local.get $addr|59
        i32.add
        i32.load8_u
        br $assembly/f18a/getRAMByte|inlined.26
       end
       i32.const 255
       i32.and
       local.get $bit
       i32.and
       i32.const 7
       local.get $bitShift
       i32.sub
       i32.shr_s
       i32.const 1
       i32.shl
       i32.or
       local.set $tileColor
       local.get $tileAttributeByte
       i32.const 15
       i32.and
       i32.const 2
       i32.shl
       local.set $tilePaletteBaseIndex
       br $break|2
      end
      local.get $patternByte
      local.get $bit
      i32.and
      i32.const 7
      local.get $bitShift
      i32.sub
      i32.shr_s
      block $assembly/f18a/getRAMByte|inlined.27 (result i32)
       local.get $patternAddr
       local.get $tilePlaneOffset
       i32.add
       i32.const 16383
       i32.and
       local.set $addr|60
       global.get $assembly/f18a/vdpRAMAddr
       local.get $addr|60
       i32.add
       i32.load8_u
       br $assembly/f18a/getRAMByte|inlined.27
      end
      i32.const 255
      i32.and
      local.get $bit
      i32.and
      i32.const 7
      local.get $bitShift
      i32.sub
      i32.shr_s
      i32.const 1
      i32.shl
      i32.or
      block $assembly/f18a/getRAMByte|inlined.28 (result i32)
       local.get $patternAddr
       local.get $tilePlaneOffset
       i32.const 1
       i32.shl
       i32.add
       i32.const 16383
       i32.and
       local.set $addr|61
       global.get $assembly/f18a/vdpRAMAddr
       local.get $addr|61
       i32.add
       i32.load8_u
       br $assembly/f18a/getRAMByte|inlined.28
      end
      i32.const 255
      i32.and
      local.get $bit
      i32.and
      i32.const 7
      local.get $bitShift
      i32.sub
      i32.shr_s
      i32.const 2
      i32.shl
      i32.or
      local.set $tileColor
      local.get $tileAttributeByte
      i32.const 14
      i32.and
      i32.const 2
      i32.shl
      local.set $tilePaletteBaseIndex
      br $break|2
     end
    else
     i32.const 1
     local.set $transparentColor0
    end
    br $break|0
   end
   block $assembly/f18a/getRAMByte|inlined.29 (result i32)
    local.get $nameTableAddr
    local.get $x1
    i32.const 3
    i32.shr_s
    i32.add
    local.get $rowOffset
    i32.add
    local.set $addr|62
    global.get $assembly/f18a/vdpRAMAddr
    local.get $addr|62
    i32.add
    i32.load8_u
    br $assembly/f18a/getRAMByte|inlined.29
   end
   i32.const 255
   i32.and
   local.set $charNo
   block $assembly/f18a/getRAMByte|inlined.30 (result i32)
    local.get $charPatternTable
    local.get $charNo
    i32.const 3
    i32.shl
    i32.add
    local.get $y1
    i32.const 28
    i32.and
    i32.const 2
    i32.shr_s
    i32.add
    local.set $addr|63
    global.get $assembly/f18a/vdpRAMAddr
    local.get $addr|63
    i32.add
    i32.load8_u
    br $assembly/f18a/getRAMByte|inlined.30
   end
   i32.const 255
   i32.and
   local.set $colorByte
   local.get $x1
   i32.const 4
   i32.and
   i32.const 0
   i32.eq
   if (result i32)
    local.get $colorByte
    i32.const 240
    i32.and
    i32.const 4
    i32.shr_s
   else
    local.get $colorByte
    i32.const 15
    i32.and
   end
   local.set $tileColor
   local.get $tilePaletteSelect
   local.set $paletteBaseIndex
   i32.const 1
   local.set $transparentColor0
   br $break|0
  end
  local.get $tilePriority
  global.set $assembly/f18a/pixelTilePriority
  local.get $transparentColor0
  global.set $assembly/f18a/pixelTransparentColor0
  local.get $tileColor
  global.set $assembly/f18a/pixelColor
  local.get $paletteBaseIndex
  global.set $assembly/f18a/pixelPaletteBaseIndex
 )
 (func $assembly/f18a/drawScanline (param $y i32) (param $displayOn i32) (param $topBorder i32) (param $drawHeight i32) (param $unlocked i32) (param $screenMode i32) (param $drawWidth i32) (param $vPageSize1 i32) (param $vPageSize2 i32) (param $hPageSize1 i32) (param $hPageSize2 i32) (param $vScroll1 i32) (param $vScroll2 i32) (param $tileLayer2Enabled i32) (param $bitmapEnable i32) (param $bitmapBaseAddr i32) (param $bitmapX i32) (param $bitmapY i32) (param $bitmapWidth i32) (param $bitmapHeight i32) (param $bitmapTransparent i32) (param $bitmapFat i32) (param $bitmapPriority i32) (param $bitmapPaletteSelect i32) (param $nameTable i32) (param $nameTable2 i32) (param $canvasWidth i32) (param $scanLines i32) (param $bgColor i32) (param $leftBorder i32) (param $tileLayer1Enabled i32) (param $tileMap2AlwaysOnTop i32) (param $colorTable i32) (param $colorTable2 i32) (param $hScroll1 i32) (param $hScroll2 i32) (param $tilePaletteSelect1 i32) (param $tilePaletteSelect2 i32) (param $tileColorMode i32) (param $row30Enabled i32) (param $spriteLinkingEnabled i32) (param $realSpriteYCoord i32) (param $maxSprites i32) (param $maxScanlineSprites i32) (param $spriteColorMode i32) (param $spritePaletteSelect i32) (param $spritePlaneOffset i32) (param $spriteSize i32) (param $spriteMag i32) (param $spriteAttributeTable i32) (param $spritePatternTable i32) (param $ecmPositionAttributes i32) (param $charPatternTable i32) (param $tilePlaneOffset i32) (param $patternTableMask i32) (param $colorTableMask i32) (param $fgColor i32) (param $statusRegister i32) (result i32)
  (local $imageDataAddr i32)
  (local $scrollWidth i32)
  (local $scrollHeight i32)
  (local $borderWidth i32)
  (local $nameTableCanonicalBase i32)
  (local $nameTableBaseAddr i32)
  (local $y1 i32)
  (local $rowOffset i32)
  (local $66 i32)
  (local $lineOffset i32)
  (local $rowOffset2 i32)
  (local $nameTableCanonicalBase2 i32)
  (local $nameTableBaseAddr2 i32)
  (local $lineOffset2 i32)
  (local $y12 i32)
  (local $73 i32)
  (local $bitmapX2 i32)
  (local $bitmapY1 i32)
  (local $bitmapY2 i32)
  (local $bitmapYOffset i32)
  (local $spritesEnabled i32)
  (local $xc i32)
  (local $color i32)
  (local $paletteBaseIndex i32)
  (local $x i32)
  (local $havePixel i32)
  (local $tilePriority i32)
  (local $bmpX i32)
  (local $bitmapX1 i32)
  (local $bitmapPixelOffset i32)
  (local $addr i32)
  (local $bitmapByte i32)
  (local $bitmapBitShift i32)
  (local $bitmapColor i32)
  (local $offset i32)
  (local $spriteColor i32)
  (local $offset|94 i32)
  (local $i i32)
  (local $rgbColor i32)
  (local $97 i32)
  (local $addr|98 i32)
  (local $value i32)
  (local $i|100 i32)
  (local $rgbColor|101 i32)
  (local $xc|102 i32)
  (local $103 i32)
  (local $addr|104 i32)
  (local $value|105 i32)
  (local $imagedataAddr2 i32)
  (local $xc|107 i32)
  (local $addr|108 i32)
  (local $rgbColor|109 i32)
  (local $110 i32)
  (local $addr|111 i32)
  (local $value|112 i32)
  i32.const 0
  local.set $imageDataAddr
  local.get $displayOn
  if (result i32)
   local.get $y
   local.get $topBorder
   i32.ge_s
  else
   i32.const 0
  end
  if (result i32)
   local.get $y
   local.get $topBorder
   local.get $drawHeight
   i32.add
   i32.lt_s
  else
   i32.const 0
  end
  if
   local.get $y
   local.get $topBorder
   i32.sub
   local.set $y
   local.get $unlocked
   if (result i32)
    i32.const 1
   else
    local.get $screenMode
    global.get $assembly/f18a/MODE_TEXT
    i32.ne
    if (result i32)
     local.get $screenMode
     global.get $assembly/f18a/MODE_TEXT_80
     i32.ne
    else
     i32.const 0
    end
   end
   if
    local.get $y
    local.get $drawWidth
    local.get $screenMode
    local.get $row30Enabled
    local.get $unlocked
    local.get $spriteLinkingEnabled
    local.get $realSpriteYCoord
    local.get $maxSprites
    local.get $maxScanlineSprites
    local.get $spriteColorMode
    local.get $spritePaletteSelect
    local.get $spritePlaneOffset
    local.get $spriteSize
    local.get $spriteMag
    local.get $spriteAttributeTable
    local.get $spritePatternTable
    local.get $statusRegister
    call $assembly/f18a/prepareSprites
    local.set $statusRegister
   end
   local.get $drawWidth
   local.set $scrollWidth
   local.get $drawHeight
   local.set $scrollHeight
   local.get $screenMode
   global.get $assembly/f18a/MODE_TEXT
   i32.eq
   if (result i32)
    i32.const 8
   else
    local.get $screenMode
    global.get $assembly/f18a/MODE_TEXT_80
    i32.eq
    if (result i32)
     i32.const 16
    else
     i32.const 0
    end
   end
   local.set $borderWidth
   local.get $scrollWidth
   local.get $borderWidth
   i32.const 1
   i32.shl
   i32.sub
   local.set $scrollWidth
   local.get $vPageSize1
   if (result i32)
    local.get $nameTable
    i32.const 12288
    i32.and
   else
    local.get $hPageSize1
    if (result i32)
     local.get $nameTable
     i32.const 14336
     i32.and
    else
     local.get $nameTable
    end
   end
   local.set $nameTableCanonicalBase
   local.get $nameTable
   local.set $nameTableBaseAddr
   local.get $y
   local.get $vScroll1
   i32.add
   local.set $y1
   local.get $y1
   local.get $scrollHeight
   i32.ge_s
   if
    local.get $y1
    local.get $scrollHeight
    i32.sub
    local.set $y1
    local.get $nameTableBaseAddr
    local.get $vPageSize1
    i32.xor
    local.set $nameTableBaseAddr
   end
   i32.const 0
   local.set $rowOffset
   block $break|0
    block $case4|0
     block $case3|0
      block $case2|0
       block $case1|0
        block $case0|0
         local.get $screenMode
         local.set $66
         local.get $66
         global.get $assembly/f18a/MODE_GRAPHICS
         i32.eq
         br_if $case0|0
         local.get $66
         global.get $assembly/f18a/MODE_BITMAP
         i32.eq
         br_if $case1|0
         local.get $66
         global.get $assembly/f18a/MODE_MULTICOLOR
         i32.eq
         br_if $case2|0
         local.get $66
         global.get $assembly/f18a/MODE_TEXT
         i32.eq
         br_if $case3|0
         local.get $66
         global.get $assembly/f18a/MODE_TEXT_80
         i32.eq
         br_if $case4|0
         br $break|0
        end
       end
      end
      local.get $y1
      i32.const 3
      i32.shr_s
      i32.const 5
      i32.shl
      local.set $rowOffset
      br $break|0
     end
     local.get $y1
     i32.const 3
     i32.shr_s
     i32.const 40
     i32.mul
     local.set $rowOffset
     br $break|0
    end
    local.get $y1
    i32.const 3
    i32.shr_s
    i32.const 80
    i32.mul
    local.set $rowOffset
    br $break|0
   end
   local.get $y1
   i32.const 7
   i32.and
   local.set $lineOffset
   i32.const 0
   local.set $rowOffset2
   i32.const 0
   local.set $nameTableCanonicalBase2
   i32.const 0
   local.set $nameTableBaseAddr2
   i32.const 0
   local.set $lineOffset2
   i32.const 0
   local.set $y12
   local.get $tileLayer2Enabled
   if
    local.get $vPageSize2
    if (result i32)
     local.get $nameTable2
     i32.const 12288
     i32.and
    else
     local.get $hPageSize2
     if (result i32)
      local.get $nameTable2
      i32.const 14336
      i32.and
     else
      local.get $nameTable2
     end
    end
    local.set $nameTableCanonicalBase2
    local.get $nameTable2
    local.set $nameTableBaseAddr2
    local.get $y
    local.get $vScroll2
    i32.add
    local.set $y12
    local.get $y12
    local.get $scrollHeight
    i32.ge_s
    if
     local.get $y12
     local.get $scrollHeight
     i32.sub
     local.set $y12
     local.get $nameTableBaseAddr2
     local.get $vPageSize2
     i32.xor
     local.set $nameTableBaseAddr2
    end
    block $break|1
     block $case4|1
      block $case3|1
       block $case2|1
        block $case1|1
         block $case0|1
          local.get $screenMode
          local.set $73
          local.get $73
          global.get $assembly/f18a/MODE_GRAPHICS
          i32.eq
          br_if $case0|1
          local.get $73
          global.get $assembly/f18a/MODE_BITMAP
          i32.eq
          br_if $case1|1
          local.get $73
          global.get $assembly/f18a/MODE_MULTICOLOR
          i32.eq
          br_if $case2|1
          local.get $73
          global.get $assembly/f18a/MODE_TEXT
          i32.eq
          br_if $case3|1
          local.get $73
          global.get $assembly/f18a/MODE_TEXT_80
          i32.eq
          br_if $case4|1
          br $break|1
         end
        end
       end
       local.get $y12
       i32.const 3
       i32.shr_s
       i32.const 5
       i32.shl
       local.set $rowOffset2
       br $break|1
      end
      local.get $y12
      i32.const 3
      i32.shr_s
      i32.const 40
      i32.mul
      local.set $rowOffset2
      br $break|1
     end
     local.get $y12
     i32.const 3
     i32.shr_s
     i32.const 80
     i32.mul
     local.set $rowOffset2
     br $break|1
    end
    local.get $y12
    i32.const 7
    i32.and
    local.set $lineOffset2
   end
   i32.const 0
   local.set $bitmapX2
   i32.const 0
   local.set $bitmapY1
   i32.const 0
   local.set $bitmapY2
   i32.const 0
   local.set $bitmapYOffset
   local.get $bitmapEnable
   if
    local.get $bitmapX
    local.get $bitmapWidth
    i32.add
    local.set $bitmapX2
    local.get $y
    local.get $bitmapY
    i32.sub
    local.set $bitmapY1
    local.get $bitmapY
    local.get $bitmapHeight
    i32.add
    local.set $bitmapY2
    local.get $bitmapY1
    local.get $bitmapWidth
    i32.mul
    local.set $bitmapYOffset
   end
   local.get $unlocked
   if (result i32)
    i32.const 1
   else
    local.get $screenMode
    global.get $assembly/f18a/MODE_TEXT
    i32.ne
    if (result i32)
     local.get $screenMode
     global.get $assembly/f18a/MODE_TEXT_80
     i32.ne
    else
     i32.const 0
    end
   end
   local.set $spritesEnabled
   i32.const 0
   local.set $xc
   loop $for-loop|2
    local.get $xc
    local.get $canvasWidth
    i32.lt_s
    if
     local.get $bgColor
     local.set $color
     i32.const 0
     local.set $paletteBaseIndex
     local.get $xc
     local.get $leftBorder
     i32.ge_s
     if (result i32)
      local.get $xc
      local.get $leftBorder
      local.get $drawWidth
      i32.add
      i32.lt_s
     else
      i32.const 0
     end
     if
      local.get $xc
      local.get $leftBorder
      i32.sub
      local.set $x
      i32.const 0
      local.set $havePixel
      i32.const 0
      local.set $tilePriority
      local.get $tileLayer1Enabled
      if
       local.get $x
       local.get $y
       local.get $y1
       local.get $rowOffset
       local.get $lineOffset
       local.get $nameTableCanonicalBase
       local.get $nameTableBaseAddr
       local.get $colorTable
       local.get $borderWidth
       local.get $scrollWidth
       local.get $hScroll1
       local.get $hPageSize1
       local.get $tilePaletteSelect1
       local.get $screenMode
       local.get $tileColorMode
       local.get $unlocked
       local.get $ecmPositionAttributes
       local.get $charPatternTable
       local.get $tilePlaneOffset
       local.get $patternTableMask
       local.get $colorTableMask
       local.get $drawWidth
       local.get $fgColor
       local.get $bgColor
       call $assembly/f18a/drawTileLayer
       global.get $assembly/f18a/pixelColor
       i32.const 0
       i32.gt_s
       if (result i32)
        i32.const 1
       else
        global.get $assembly/f18a/pixelTransparentColor0
        i32.eqz
       end
       if
        global.get $assembly/f18a/pixelColor
        local.set $color
        global.get $assembly/f18a/pixelPaletteBaseIndex
        local.set $paletteBaseIndex
        global.get $assembly/f18a/pixelTilePriority
        local.set $tilePriority
        i32.const 1
        local.set $havePixel
       end
      end
      local.get $bitmapEnable
      if
       local.get $screenMode
       global.get $assembly/f18a/MODE_TEXT_80
       i32.ne
       if (result i32)
        local.get $x
       else
        local.get $x
        i32.const 1
        i32.shr_s
       end
       local.set $bmpX
       local.get $bmpX
       local.get $bitmapX
       i32.ge_s
       if (result i32)
        local.get $bmpX
        local.get $bitmapX2
        i32.lt_s
       else
        i32.const 0
       end
       if (result i32)
        local.get $y
        local.get $bitmapY
        i32.ge_s
       else
        i32.const 0
       end
       if (result i32)
        local.get $y
        local.get $bitmapY2
        i32.lt_s
       else
        i32.const 0
       end
       if
        local.get $x
        local.get $bitmapX
        i32.sub
        local.set $bitmapX1
        local.get $bitmapX1
        local.get $bitmapYOffset
        i32.add
        local.set $bitmapPixelOffset
        block $assembly/f18a/getRAMByte|inlined.31 (result i32)
         local.get $bitmapBaseAddr
         local.get $bitmapPixelOffset
         i32.const 2
         i32.shr_s
         i32.add
         local.set $addr
         global.get $assembly/f18a/vdpRAMAddr
         local.get $addr
         i32.add
         i32.load8_u
         br $assembly/f18a/getRAMByte|inlined.31
        end
        i32.const 255
        i32.and
        local.set $bitmapByte
        local.get $bitmapFat
        if
         i32.const 2
         local.get $bitmapPixelOffset
         i32.const 2
         i32.and
         i32.sub
         i32.const 1
         i32.shl
         local.set $bitmapBitShift
         local.get $bitmapByte
         local.get $bitmapBitShift
         i32.shr_s
         i32.const 15
         i32.and
         local.set $bitmapColor
        else
         i32.const 3
         local.get $bitmapPixelOffset
         i32.const 3
         i32.and
         i32.sub
         i32.const 1
         i32.shl
         local.set $bitmapBitShift
         local.get $bitmapByte
         local.get $bitmapBitShift
         i32.shr_s
         i32.const 3
         i32.and
         local.set $bitmapColor
        end
        local.get $bitmapColor
        i32.const 0
        i32.gt_s
        if (result i32)
         i32.const 1
        else
         local.get $bitmapTransparent
         i32.eqz
        end
        if (result i32)
         local.get $bitmapPriority
         if (result i32)
          i32.const 1
         else
          local.get $havePixel
          i32.eqz
         end
        else
         i32.const 0
        end
        if
         local.get $bitmapColor
         local.set $color
         local.get $bitmapPaletteSelect
         local.set $paletteBaseIndex
         local.get $tilePriority
         if (result i32)
          local.get $bitmapPriority
          i32.eqz
         else
          i32.const 0
         end
         local.set $tilePriority
        end
       end
      end
      local.get $tileLayer2Enabled
      if
       local.get $x
       local.get $y
       local.get $y1
       local.get $rowOffset2
       local.get $lineOffset2
       local.get $nameTableCanonicalBase2
       local.get $nameTableBaseAddr2
       local.get $colorTable2
       local.get $borderWidth
       local.get $scrollWidth
       local.get $hScroll2
       local.get $hPageSize2
       local.get $tilePaletteSelect2
       local.get $screenMode
       local.get $tileColorMode
       local.get $unlocked
       local.get $ecmPositionAttributes
       local.get $charPatternTable
       local.get $tilePlaneOffset
       local.get $patternTableMask
       local.get $colorTableMask
       local.get $drawWidth
       local.get $fgColor
       local.get $bgColor
       call $assembly/f18a/drawTileLayer
       global.get $assembly/f18a/pixelColor
       i32.const 0
       i32.gt_s
       if (result i32)
        i32.const 1
       else
        global.get $assembly/f18a/pixelTransparentColor0
        i32.eqz
       end
       if
        global.get $assembly/f18a/pixelColor
        local.set $color
        global.get $assembly/f18a/pixelPaletteBaseIndex
        local.set $paletteBaseIndex
        global.get $assembly/f18a/pixelTilePriority
        if (result i32)
         i32.const 1
        else
         local.get $tileMap2AlwaysOnTop
        end
        local.set $tilePriority
        i32.const 1
        local.set $havePixel
       end
      end
      local.get $spritesEnabled
      if (result i32)
       local.get $tilePriority
       if (result i32)
        local.get $havePixel
       else
        i32.const 0
       end
       i32.eqz
      else
       i32.const 0
      end
      if
       block $assembly/f18a/getSpriteColorBuffer|inlined.3 (result i32)
        local.get $x
        local.set $offset
        global.get $assembly/f18a/spriteColorBufferAddr
        local.get $offset
        i32.const 2
        i32.shl
        i32.add
        i32.load
        br $assembly/f18a/getSpriteColorBuffer|inlined.3
       end
       i32.const 1
       i32.sub
       local.set $spriteColor
       local.get $spriteColor
       i32.const 0
       i32.gt_s
       if
        local.get $spriteColor
        local.set $color
        block $assembly/f18a/getSpritePaletteBaseIndexBuffer|inlined.1 (result i32)
         local.get $x
         local.set $offset|94
         global.get $assembly/f18a/spritePaletteBaseIndexBufferAddr
         local.get $offset|94
         i32.const 2
         i32.shl
         i32.add
         i32.load
         br $assembly/f18a/getSpritePaletteBaseIndexBuffer|inlined.1
        end
        local.set $paletteBaseIndex
       end
      end
     end
     block $assembly/f18a/getColor|inlined.0 (result i32)
      local.get $color
      local.get $paletteBaseIndex
      i32.add
      local.set $i
      global.get $assembly/f18a/paletteAddr
      local.get $i
      i32.const 2
      i32.shl
      i32.add
      i32.load
      br $assembly/f18a/getColor|inlined.0
     end
     local.set $rgbColor
     local.get $imageDataAddr
     local.tee $97
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $97
     local.set $addr|98
     local.get $rgbColor
     local.set $value
     global.get $assembly/f18a/scanlineColorBufferAddr
     local.get $addr|98
     i32.const 2
     i32.shl
     i32.add
     local.get $value
     i32.store
     local.get $xc
     i32.const 1
     i32.add
     local.set $xc
     br $for-loop|2
    end
   end
  else
   block $assembly/f18a/getColor|inlined.1 (result i32)
    local.get $bgColor
    local.set $i|100
    global.get $assembly/f18a/paletteAddr
    local.get $i|100
    i32.const 2
    i32.shl
    i32.add
    i32.load
    br $assembly/f18a/getColor|inlined.1
   end
   local.set $rgbColor|101
   i32.const 0
   local.set $xc|102
   loop $for-loop|3
    local.get $xc|102
    local.get $canvasWidth
    i32.lt_s
    if
     local.get $imageDataAddr
     local.tee $103
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $103
     local.set $addr|104
     local.get $rgbColor|101
     local.set $value|105
     global.get $assembly/f18a/scanlineColorBufferAddr
     local.get $addr|104
     i32.const 2
     i32.shl
     i32.add
     local.get $value|105
     i32.store
     local.get $xc|102
     i32.const 1
     i32.add
     local.set $xc|102
     br $for-loop|3
    end
   end
  end
  local.get $scanLines
  if (result i32)
   local.get $y
   i32.const 1
   i32.and
   i32.const 0
   i32.ne
  else
   i32.const 0
  end
  if
   local.get $imageDataAddr
   local.get $canvasWidth
   i32.const 2
   i32.shl
   i32.sub
   local.set $imagedataAddr2
   i32.const 0
   local.set $xc|107
   loop $for-loop|4
    local.get $xc|107
    local.get $canvasWidth
    i32.lt_s
    if
     block $assembly/f18a/getImageData|inlined.0 (result i32)
      local.get $imagedataAddr2
      local.set $addr|108
      global.get $assembly/f18a/scanlineColorBufferAddr
      local.get $addr|108
      i32.const 2
      i32.shl
      i32.add
      i32.load
      br $assembly/f18a/getImageData|inlined.0
     end
     local.set $rgbColor|109
     local.get $imagedataAddr2
     local.tee $110
     i32.const 1
     i32.add
     local.set $imagedataAddr2
     local.get $110
     local.set $addr|111
     local.get $rgbColor|109
     local.set $value|112
     global.get $assembly/f18a/scanlineColorBufferAddr
     local.get $addr|111
     i32.const 2
     i32.shl
     i32.add
     local.get $value|112
     i32.store
     local.get $xc|107
     i32.const 1
     i32.add
     local.set $xc|107
     br $for-loop|4
    end
   end
  end
  local.get $statusRegister
  i32.const 255
  i32.and
  return
 )
)
