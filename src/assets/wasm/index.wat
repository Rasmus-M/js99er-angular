(module
 (type $none_=>_none (func))
 (type $i32_i32_=>_none (func (param i32 i32)))
 (type $i32_=>_i32 (func (param i32) (result i32)))
 (type $i32_i32_i32_i32_i32_i32_i32_i32_i32_i32_i32_i32_i32_i32_i32_i32_i32_i32_i32_=>_i32 (func (param i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32 i32) (result i32)))
 (import "env" "memory" (memory $0 1))
 (table $0 1 1 funcref)
 (elem $0 (i32.const 1))
 (export "drawScanline" (func $assembly/index/drawScanline))
 (export "memory" (memory $0))
 (func $assembly/index/initSpriteBuffer
  (local $i i32)
  i32.const 0
  local.set $i
  loop $for-loop|0
   local.get $i
   i32.const 256
   i32.lt_s
   if
    i32.const 24576
    local.get $i
    i32.add
    i32.const -1
    i32.store8 $0
    local.get $i
    i32.const 1
    i32.add
    local.set $i
    br $for-loop|0
   end
  end
 )
 (func $assembly/index/setSpriteBuffer (param $offset i32) (param $value i32)
  i32.const 24576
  local.get $offset
  i32.add
  local.get $value
  i32.store8 $0
 )
 (func $assembly/index/getColor (param $i i32) (result i32)
  (local $1 i32)
  block $break|0
   block $case15|0
    block $case14|0
     block $case13|0
      block $case12|0
       block $case11|0
        block $case10|0
         block $case9|0
          block $case8|0
           block $case7|0
            block $case6|0
             block $case5|0
              block $case4|0
               block $case3|0
                block $case2|0
                 block $case1|0
                  block $case0|0
                   local.get $i
                   i32.const 15
                   i32.and
                   local.set $1
                   local.get $1
                   i32.const 0
                   i32.eq
                   br_if $case0|0
                   local.get $1
                   i32.const 1
                   i32.eq
                   br_if $case1|0
                   local.get $1
                   i32.const 2
                   i32.eq
                   br_if $case2|0
                   local.get $1
                   i32.const 3
                   i32.eq
                   br_if $case3|0
                   local.get $1
                   i32.const 4
                   i32.eq
                   br_if $case4|0
                   local.get $1
                   i32.const 5
                   i32.eq
                   br_if $case5|0
                   local.get $1
                   i32.const 6
                   i32.eq
                   br_if $case6|0
                   local.get $1
                   i32.const 7
                   i32.eq
                   br_if $case7|0
                   local.get $1
                   i32.const 8
                   i32.eq
                   br_if $case8|0
                   local.get $1
                   i32.const 9
                   i32.eq
                   br_if $case9|0
                   local.get $1
                   i32.const 10
                   i32.eq
                   br_if $case10|0
                   local.get $1
                   i32.const 11
                   i32.eq
                   br_if $case11|0
                   local.get $1
                   i32.const 12
                   i32.eq
                   br_if $case12|0
                   local.get $1
                   i32.const 13
                   i32.eq
                   br_if $case13|0
                   local.get $1
                   i32.const 14
                   i32.eq
                   br_if $case14|0
                   local.get $1
                   i32.const 15
                   i32.eq
                   br_if $case15|0
                   br $break|0
                  end
                  i32.const 0
                  return
                 end
                 i32.const 0
                 return
                end
                i32.const 2213954
                return
               end
               i32.const 6216824
               return
              end
              i32.const 5527021
              return
             end
             i32.const 8222460
             return
            end
            i32.const 13914701
            return
           end
           i32.const 4385781
           return
          end
          i32.const 16536916
          return
         end
         i32.const 16742776
         return
        end
        i32.const 13943124
        return
       end
       i32.const 15126144
       return
      end
      i32.const 2207803
      return
     end
     i32.const 13196218
     return
    end
    i32.const 13421772
    return
   end
   i32.const 16777215
   return
  end
  i32.const 0
  return
 )
 (func $assembly/index/drawScanline (param $y i32) (param $width i32) (param $height i32) (param $screenMode i32) (param $textMode i32) (param $bitmapMode i32) (param $fgColor i32) (param $bgColor i32) (param $nameTable i32) (param $colorTable i32) (param $charPatternTable i32) (param $colorTableMask i32) (param $patternTableMask i32) (param $spriteAttributeTable i32) (param $spritePatternTable i32) (param $vr1 i32) (param $vr4 i32) (param $displayOn i32) (param $statusRegister i32) (result i32)
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
  (local $y1 i32)
  (local $spritesOnLine i32)
  (local $endMarkerFound i32)
  (local $spriteAttributeAddr i32)
  (local $s i32)
  (local $addr i32)
  (local $sy i32)
  (local $sy1 i32)
  (local $y2 i32)
  (local $yMasked i32)
  (local $addr|46 i32)
  (local $sx i32)
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
  (local $81 i32)
  (local $addr|82 i32)
  (local $value i32)
  (local $84 i32)
  (local $addr|85 i32)
  (local $value|86 i32)
  (local $87 i32)
  (local $addr|88 i32)
  (local $value|89 i32)
  (local $90 i32)
  (local $addr|91 i32)
  (local $value|92 i32)
  (local $93 i32)
  (local $addr|94 i32)
  (local $value|95 i32)
  (local $96 i32)
  (local $addr|97 i32)
  (local $value|98 i32)
  (local $99 i32)
  (local $addr|100 i32)
  (local $value|101 i32)
  (local $102 i32)
  (local $addr|103 i32)
  (local $value|104 i32)
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
   local.set $y1
   local.get $textMode
   i32.eqz
   if
    call $assembly/index/initSpriteBuffer
    i32.const 0
    local.set $spritesOnLine
    i32.const 0
    local.set $endMarkerFound
    local.get $spriteAttributeTable
    local.set $spriteAttributeAddr
    i32.const 0
    local.set $s
    loop $for-loop|0
     local.get $s
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
      block $assembly/index/ramByte|inlined.0 (result i32)
       local.get $spriteAttributeAddr
       local.set $addr
       local.get $addr
       i32.load8_u $0
       br $assembly/index/ramByte|inlined.0
      end
      i32.const 255
      i32.and
      local.set $sy
      local.get $sy
      i32.const 208
      i32.ne
      if
       local.get $sy
       i32.const 208
       i32.gt_s
       if
        local.get $sy
        i32.const 256
        i32.sub
        local.set $sy
       end
       local.get $sy
       i32.const 1
       i32.add
       local.set $sy
       local.get $sy
       local.get $spriteDimension
       i32.add
       local.set $sy1
       i32.const -1
       local.set $y2
       local.get $s
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
        local.get $y1
        local.get $sy
        i32.ge_s
        if (result i32)
         local.get $y1
         local.get $sy1
         i32.lt_s
        else
         i32.const 0
        end
        if
         local.get $y1
         local.set $y2
        end
       else
        local.get $y1
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
        local.get $sy
        i32.ge_s
        if (result i32)
         local.get $yMasked
         local.get $sy1
         i32.lt_s
        else
         i32.const 0
        end
        if
         local.get $yMasked
         local.set $y2
        else
         local.get $y1
         i32.const 64
         i32.ge_s
         if (result i32)
          local.get $y1
          i32.const 128
          i32.lt_s
         else
          i32.const 0
         end
         if (result i32)
          local.get $y1
          local.get $sy
          i32.ge_s
         else
          i32.const 0
         end
         if (result i32)
          local.get $y1
          local.get $sy1
          i32.lt_s
         else
          i32.const 0
         end
         if
          local.get $y1
          local.set $y2
         end
        end
       end
       local.get $y2
       i32.const -1
       i32.ne
       if
        local.get $spritesOnLine
        i32.const 4
        i32.lt_s
        if
         block $assembly/index/ramByte|inlined.1 (result i32)
          local.get $spriteAttributeAddr
          i32.const 1
          i32.add
          local.set $addr|46
          local.get $addr|46
          i32.load8_u $0
          br $assembly/index/ramByte|inlined.1
         end
         local.set $sx
         block $assembly/index/ramByte|inlined.2 (result i32)
          local.get $spriteAttributeAddr
          i32.const 2
          i32.add
          local.set $addr|48
          local.get $addr|48
          i32.load8_u $0
          br $assembly/index/ramByte|inlined.2
         end
         local.get $spriteSize
         if (result i32)
          i32.const 252
         else
          i32.const 255
         end
         i32.and
         local.set $sPatternNo
         block $assembly/index/ramByte|inlined.3 (result i32)
          local.get $spriteAttributeAddr
          i32.const 3
          i32.add
          local.set $addr|50
          local.get $addr|50
          i32.load8_u $0
          br $assembly/index/ramByte|inlined.3
         end
         i32.const 15
         i32.and
         local.set $sColor
         block $assembly/index/ramByte|inlined.4 (result i32)
          local.get $spriteAttributeAddr
          i32.const 3
          i32.add
          local.set $addr|52
          local.get $addr|52
          i32.load8_u $0
          br $assembly/index/ramByte|inlined.4
         end
         i32.const 128
         i32.and
         i32.const 0
         i32.ne
         if
          local.get $sx
          i32.const 32
          i32.sub
          local.set $sx
         end
         local.get $y2
         local.get $sy
         i32.sub
         local.get $spriteMagnify
         i32.shr_s
         local.set $sLine
         local.get $spritePatternTable
         local.get $sPatternNo
         i32.const 3
         i32.const 7
         i32.and
         i32.shl
         i32.const 255
         i32.and
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
           local.get $sx
           i32.const 255
           i32.and
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
            block $assembly/index/ramByte|inlined.5 (result i32)
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
             local.get $addr|58
             i32.load8_u $0
             br $assembly/index/ramByte|inlined.5
            end
            local.set $sPatternByte
            local.get $sPatternByte
            i32.const 128
            local.get $sx3
            i32.const 7
            i32.and
            i32.const 7
            i32.and
            i32.shr_u
            i32.and
            i32.const 0
            i32.ne
            if
             block $assembly/index/getSpriteBuffer|inlined.0 (result i32)
              local.get $sx2
              local.set $offset
              i32.const 24576
              local.get $offset
              i32.add
              i32.load8_s $0
              br $assembly/index/getSpriteBuffer|inlined.0
             end
             i32.extend8_s
             i32.const -1
             i32.eq
             if
              local.get $sx2
              local.get $sColor
              call $assembly/index/setSpriteBuffer
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
      local.get $s
      i32.const 1
      i32.add
      local.set $s
      br $for-loop|0
     end
    end
    local.get $spritesOnLine
    i32.const 4
    i32.gt_s
    if
     i32.const 1
     local.set $fifthSprite
     local.get $s
     local.set $fifthSpriteIndex
    end
   end
   local.get $textMode
   i32.eqz
   if (result i32)
    local.get $y1
    i32.const 3
    i32.shr_s
    i32.const 5
    i32.shl
   else
    local.get $y1
    i32.const 3
    i32.shr_s
    i32.const 40
    i32.mul
   end
   local.set $rowOffset
   local.get $y1
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
              i32.const 0
              i32.eq
              br_if $case0|3
              local.get $64
              i32.const 2
              i32.eq
              br_if $case1|3
              local.get $64
              i32.const 3
              i32.eq
              br_if $case2|3
              local.get $64
              i32.const 1
              i32.eq
              br_if $case3|3
              local.get $64
              i32.const 4
              i32.eq
              br_if $case4|3
              local.get $64
              i32.const 5
              i32.eq
              br_if $case5|3
              local.get $64
              i32.const 6
              i32.eq
              br_if $case6|3
              br $break|3
             end
             block $assembly/index/ramByte|inlined.6 (result i32)
              local.get $nameTable
              local.get $rowOffset
              i32.add
              local.get $x1
              i32.const 3
              i32.shr_s
              i32.add
              local.set $addr|65
              local.get $addr|65
              i32.load8_u $0
              br $assembly/index/ramByte|inlined.6
             end
             i32.const 255
             i32.and
             local.set $name
             block $assembly/index/ramByte|inlined.7 (result i32)
              local.get $colorTable
              local.get $name
              i32.const 3
              i32.shr_s
              i32.add
              local.set $addr|66
              local.get $addr|66
              i32.load8_u $0
              br $assembly/index/ramByte|inlined.7
             end
             i32.const 255
             i32.and
             local.set $colorByte
             block $assembly/index/ramByte|inlined.8 (result i32)
              local.get $charPatternTable
              local.get $name
              i32.const 3
              i32.shl
              i32.add
              local.get $lineOffset
              i32.add
              local.set $addr|67
              local.get $addr|67
              i32.load8_u $0
              br $assembly/index/ramByte|inlined.8
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
            block $assembly/index/ramByte|inlined.9 (result i32)
             local.get $nameTable
             local.get $rowOffset
             i32.add
             local.get $x1
             i32.const 3
             i32.shr_s
             i32.add
             local.set $addr|68
             local.get $addr|68
             i32.load8_u $0
             br $assembly/index/ramByte|inlined.9
            end
            i32.const 255
            i32.and
            local.set $name
            local.get $y1
            i32.const 192
            i32.and
            i32.const 5
            i32.shl
            local.get $name
            i32.const 3
            i32.shl
            i32.add
            local.set $tableOffset
            block $assembly/index/ramByte|inlined.10 (result i32)
             local.get $colorTable
             local.get $tableOffset
             local.get $colorTableMask
             i32.and
             i32.add
             local.get $lineOffset
             i32.add
             local.set $addr|69
             local.get $addr|69
             i32.load8_u $0
             br $assembly/index/ramByte|inlined.10
            end
            i32.const 255
            i32.and
            local.set $colorByte
            block $assembly/index/ramByte|inlined.11 (result i32)
             local.get $charPatternTable
             local.get $tableOffset
             local.get $patternTableMask
             i32.and
             i32.add
             local.get $lineOffset
             i32.add
             local.set $addr|70
             local.get $addr|70
             i32.load8_u $0
             br $assembly/index/ramByte|inlined.11
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
           block $assembly/index/ramByte|inlined.12 (result i32)
            local.get $nameTable
            local.get $rowOffset
            i32.add
            local.get $x1
            i32.const 3
            i32.shr_s
            i32.add
            local.set $addr|71
            local.get $addr|71
            i32.load8_u $0
            br $assembly/index/ramByte|inlined.12
           end
           i32.const 255
           i32.and
           local.set $name
           local.get $y1
           i32.const 28
           i32.and
           i32.const 2
           i32.shr_s
           local.set $lineOffset
           block $assembly/index/ramByte|inlined.13 (result i32)
            local.get $charPatternTable
            local.get $name
            i32.const 3
            i32.shl
            i32.add
            local.get $lineOffset
            i32.add
            local.set $addr|72
            local.get $addr|72
            i32.load8_u $0
            br $assembly/index/ramByte|inlined.13
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
          block $assembly/index/ramByte|inlined.14 (result i32)
           local.get $nameTable
           local.get $rowOffset
           i32.add
           local.get $x1
           i32.const 6
           i32.div_s
           i32.add
           local.set $addr|73
           local.get $addr|73
           i32.load8_u $0
           br $assembly/index/ramByte|inlined.14
          end
          i32.const 255
          i32.and
          local.set $name
          block $assembly/index/ramByte|inlined.15 (result i32)
           local.get $charPatternTable
           local.get $name
           i32.const 3
           i32.shl
           i32.add
           local.get $lineOffset
           i32.add
           local.set $addr|74
           local.get $addr|74
           i32.load8_u $0
           br $assembly/index/ramByte|inlined.15
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
         block $assembly/index/ramByte|inlined.16 (result i32)
          local.get $nameTable
          local.get $rowOffset
          i32.add
          local.get $x1
          i32.const 6
          i32.div_s
          i32.add
          local.set $addr|75
          local.get $addr|75
          i32.load8_u $0
          br $assembly/index/ramByte|inlined.16
         end
         i32.const 255
         i32.and
         local.set $name
         local.get $y1
         i32.const 192
         i32.and
         i32.const 5
         i32.shl
         local.get $name
         i32.const 3
         i32.shl
         i32.add
         local.set $tableOffset
         block $assembly/index/ramByte|inlined.17 (result i32)
          local.get $charPatternTable
          local.get $tableOffset
          local.get $patternTableMask
          i32.and
          i32.add
          local.get $lineOffset
          i32.add
          local.set $addr|76
          local.get $addr|76
          i32.load8_u $0
          br $assembly/index/ramByte|inlined.17
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
        block $assembly/index/ramByte|inlined.18 (result i32)
         local.get $nameTable
         local.get $rowOffset
         i32.add
         local.get $x1
         i32.const 3
         i32.shr_s
         i32.add
         local.set $addr|77
         local.get $addr|77
         i32.load8_u $0
         br $assembly/index/ramByte|inlined.18
        end
        i32.const 255
        i32.and
        local.set $name
        local.get $y1
        i32.const 28
        i32.and
        i32.const 2
        i32.shr_s
        local.set $lineOffset
        local.get $y1
        i32.const 192
        i32.and
        i32.const 5
        i32.shl
        local.get $name
        i32.const 3
        i32.shl
        i32.add
        local.set $tableOffset
        block $assembly/index/ramByte|inlined.19 (result i32)
         local.get $charPatternTable
         local.get $tableOffset
         local.get $patternTableMask
         i32.and
         i32.add
         local.get $lineOffset
         i32.add
         local.set $addr|78
         local.get $addr|78
         i32.load8_u $0
         br $assembly/index/ramByte|inlined.19
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
       block $assembly/index/getSpriteBuffer|inlined.1 (result i32)
        local.get $x1
        local.set $offset|79
        i32.const 24576
        local.get $offset|79
        i32.add
        i32.load8_s $0
        br $assembly/index/getSpriteBuffer|inlined.1
       end
       local.set $spriteColor
       local.get $spriteColor
       i32.extend8_s
       i32.const 0
       i32.gt_s
       if
        local.get $spriteColor
        i32.extend8_s
        local.set $color
       end
      end
     else
      local.get $bgColor
      local.set $color
     end
     local.get $color
     call $assembly/index/getColor
     local.set $rgbColor
     local.get $imageDataAddr
     local.tee $81
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $81
     local.set $addr|82
     local.get $rgbColor
     i32.const 16711680
     i32.and
     i32.const 16
     i32.shr_u
     local.set $value
     local.get $addr|82
     i32.const 16384
     i32.add
     local.get $value
     i32.store8 $0
     local.get $imageDataAddr
     local.tee $84
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $84
     local.set $addr|85
     local.get $rgbColor
     i32.const 65280
     i32.and
     i32.const 8
     i32.shr_u
     local.set $value|86
     local.get $addr|85
     i32.const 16384
     i32.add
     local.get $value|86
     i32.store8 $0
     local.get $imageDataAddr
     local.tee $87
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $87
     local.set $addr|88
     local.get $rgbColor
     i32.const 255
     i32.and
     local.set $value|89
     local.get $addr|88
     i32.const 16384
     i32.add
     local.get $value|89
     i32.store8 $0
     local.get $imageDataAddr
     local.tee $90
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $90
     local.set $addr|91
     i32.const 255
     local.set $value|92
     local.get $addr|91
     i32.const 16384
     i32.add
     local.get $value|92
     i32.store8 $0
     local.get $x
     i32.const 1
     i32.add
     local.set $x
     br $for-loop|2
    end
   end
  else
   local.get $bgColor
   call $assembly/index/getColor
   local.set $rgbColor
   i32.const 0
   local.set $x
   loop $for-loop|4
    local.get $x
    local.get $width
    i32.lt_s
    if
     local.get $imageDataAddr
     local.tee $93
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $93
     local.set $addr|94
     local.get $rgbColor
     i32.const 16711680
     i32.and
     i32.const 16
     i32.shr_u
     local.set $value|95
     local.get $addr|94
     i32.const 16384
     i32.add
     local.get $value|95
     i32.store8 $0
     local.get $imageDataAddr
     local.tee $96
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $96
     local.set $addr|97
     local.get $rgbColor
     i32.const 65280
     i32.and
     i32.const 8
     i32.shr_u
     local.set $value|98
     local.get $addr|97
     i32.const 16384
     i32.add
     local.get $value|98
     i32.store8 $0
     local.get $imageDataAddr
     local.tee $99
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $99
     local.set $addr|100
     local.get $rgbColor
     i32.const 255
     i32.and
     local.set $value|101
     local.get $addr|100
     i32.const 16384
     i32.add
     local.get $value|101
     i32.store8 $0
     local.get $imageDataAddr
     local.tee $102
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $102
     local.set $addr|103
     i32.const 255
     local.set $value|104
     local.get $addr|103
     i32.const 16384
     i32.add
     local.get $value|104
     i32.store8 $0
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
   local.get $fifthSpriteIndex
   i32.or
   local.set $statusRegister
  end
  local.get $fifthSprite
  if
   local.get $statusRegister
   i32.const 64
   i32.or
   local.set $statusRegister
  end
  local.get $statusRegister
  i32.const 255
  i32.and
  return
 )
)
