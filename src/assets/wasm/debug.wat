(module
 (type $i32_=>_i32 (func (param i32) (result i32)))
 (type $i32_i32_=>_none (func (param i32 i32)))
 (type $none_=>_none (func))
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
 (func $assembly/index/ramByte (param $addr i32) (result i32)
  local.get $addr
  i32.load8_u $0
  return
 )
 (func $assembly/index/getSpriteBuffer (param $offset i32) (result i32)
  i32.const 24576
  local.get $offset
  i32.add
  i32.load8_s $0
  return
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
 (func $assembly/index/setImageData (param $addr i32) (param $value i32)
  local.get $addr
  i32.const 16384
  i32.add
  local.get $value
  i32.store8 $0
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
  (local $sy i32)
  (local $sy1 i32)
  (local $y2 i32)
  (local $yMasked i32)
  (local $sx i32)
  (local $sPatternNo i32)
  (local $sColor i32)
  (local $sLine i32)
  (local $sPatternBase i32)
  (local $sx1 i32)
  (local $sx2 i32)
  (local $sx3 i32)
  (local $sPatternByte i32)
  (local $rowOffset i32)
  (local $lineOffset i32)
  (local $x1 i32)
  (local $57 i32)
  (local $spriteColor i32)
  (local $59 i32)
  (local $60 i32)
  (local $61 i32)
  (local $62 i32)
  (local $63 i32)
  (local $64 i32)
  (local $65 i32)
  (local $66 i32)
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
      local.get $spriteAttributeAddr
      call $assembly/index/ramByte
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
         local.get $spriteAttributeAddr
         i32.const 1
         i32.add
         call $assembly/index/ramByte
         local.set $sx
         local.get $spriteAttributeAddr
         i32.const 2
         i32.add
         call $assembly/index/ramByte
         local.get $spriteSize
         if (result i32)
          i32.const 252
         else
          i32.const 255
         end
         i32.and
         local.set $sPatternNo
         local.get $spriteAttributeAddr
         i32.const 3
         i32.add
         call $assembly/index/ramByte
         i32.const 15
         i32.and
         local.set $sColor
         local.get $spriteAttributeAddr
         i32.const 3
         i32.add
         call $assembly/index/ramByte
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
            call $assembly/index/ramByte
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
             local.get $sx2
             call $assembly/index/getSpriteBuffer
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
              local.set $57
              local.get $57
              i32.const 0
              i32.eq
              br_if $case0|3
              local.get $57
              i32.const 2
              i32.eq
              br_if $case1|3
              local.get $57
              i32.const 3
              i32.eq
              br_if $case2|3
              local.get $57
              i32.const 1
              i32.eq
              br_if $case3|3
              local.get $57
              i32.const 4
              i32.eq
              br_if $case4|3
              local.get $57
              i32.const 5
              i32.eq
              br_if $case5|3
              local.get $57
              i32.const 6
              i32.eq
              br_if $case6|3
              br $break|3
             end
             local.get $nameTable
             local.get $rowOffset
             i32.add
             local.get $x1
             i32.const 3
             i32.shr_s
             i32.add
             call $assembly/index/ramByte
             local.set $name
             local.get $colorTable
             local.get $name
             i32.const 3
             i32.shr_s
             i32.add
             call $assembly/index/ramByte
             local.set $colorByte
             local.get $charPatternTable
             local.get $name
             i32.const 3
             i32.shl
             i32.add
             local.get $lineOffset
             i32.add
             call $assembly/index/ramByte
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
            local.get $nameTable
            local.get $rowOffset
            i32.add
            local.get $x1
            i32.const 3
            i32.shr_s
            i32.add
            call $assembly/index/ramByte
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
            local.get $colorTable
            local.get $tableOffset
            local.get $colorTableMask
            i32.and
            i32.add
            local.get $lineOffset
            i32.add
            call $assembly/index/ramByte
            local.set $colorByte
            local.get $charPatternTable
            local.get $tableOffset
            local.get $patternTableMask
            i32.and
            i32.add
            local.get $lineOffset
            i32.add
            call $assembly/index/ramByte
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
           local.get $nameTable
           local.get $rowOffset
           i32.add
           local.get $x1
           i32.const 3
           i32.shr_s
           i32.add
           call $assembly/index/ramByte
           local.set $name
           local.get $y1
           i32.const 28
           i32.and
           i32.const 2
           i32.shr_s
           local.set $lineOffset
           local.get $charPatternTable
           local.get $name
           i32.const 3
           i32.shl
           i32.add
           local.get $lineOffset
           i32.add
           call $assembly/index/ramByte
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
          local.get $nameTable
          local.get $rowOffset
          i32.add
          local.get $x1
          i32.const 6
          i32.div_s
          i32.add
          call $assembly/index/ramByte
          local.set $name
          local.get $charPatternTable
          local.get $name
          i32.const 3
          i32.shl
          i32.add
          local.get $lineOffset
          i32.add
          call $assembly/index/ramByte
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
         local.get $nameTable
         local.get $rowOffset
         i32.add
         local.get $x1
         i32.const 6
         i32.div_s
         i32.add
         call $assembly/index/ramByte
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
         local.get $charPatternTable
         local.get $tableOffset
         local.get $patternTableMask
         i32.and
         i32.add
         local.get $lineOffset
         i32.add
         call $assembly/index/ramByte
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
        local.get $nameTable
        local.get $rowOffset
        i32.add
        local.get $x1
        i32.const 3
        i32.shr_s
        i32.add
        call $assembly/index/ramByte
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
        local.get $charPatternTable
        local.get $tableOffset
        local.get $patternTableMask
        i32.and
        i32.add
        local.get $lineOffset
        i32.add
        call $assembly/index/ramByte
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
       local.get $x1
       call $assembly/index/getSpriteBuffer
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
     local.get $color
     call $assembly/index/getColor
     local.set $rgbColor
     local.get $imageDataAddr
     local.tee $59
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $59
     local.get $rgbColor
     i32.const 16711680
     i32.and
     i32.const 16
     i32.shr_u
     call $assembly/index/setImageData
     local.get $imageDataAddr
     local.tee $60
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $60
     local.get $rgbColor
     i32.const 65280
     i32.and
     i32.const 8
     i32.shr_u
     call $assembly/index/setImageData
     local.get $imageDataAddr
     local.tee $61
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $61
     local.get $rgbColor
     i32.const 255
     i32.and
     call $assembly/index/setImageData
     local.get $imageDataAddr
     local.tee $62
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $62
     i32.const 255
     call $assembly/index/setImageData
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
     local.tee $63
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $63
     local.get $rgbColor
     i32.const 16711680
     i32.and
     i32.const 16
     i32.shr_u
     call $assembly/index/setImageData
     local.get $imageDataAddr
     local.tee $64
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $64
     local.get $rgbColor
     i32.const 65280
     i32.and
     i32.const 8
     i32.shr_u
     call $assembly/index/setImageData
     local.get $imageDataAddr
     local.tee $65
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $65
     local.get $rgbColor
     i32.const 255
     i32.and
     call $assembly/index/setImageData
     local.get $imageDataAddr
     local.tee $66
     i32.const 1
     i32.add
     local.set $imageDataAddr
     local.get $66
     i32.const 255
     call $assembly/index/setImageData
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
