/**
 * File: Loading.content.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/18 19:12
 */
import SkeletonBar from '@/components/loading/SkeletonBar'

export default function ContentLoading () {
  return (
    <div class="h-full overflow-hidden p-4 space-y-6">
      <div class="flex-1 space-y-6 py-1">
        <SkeletonBar class="animate-slash h-8 w-1/2"></SkeletonBar>
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-4">
            <SkeletonBar class="col-span-2"></SkeletonBar>
          </div>
          <SkeletonBar class="w-9/12"></SkeletonBar>
        </div>
      </div>
      
      <div class="flex-1 space-y-6 py-1">
        <SkeletonBar class="w-10/12"></SkeletonBar>
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-4">
            <SkeletonBar class="col-span-2"></SkeletonBar>
          </div>
          <SkeletonBar class="w-9/12"></SkeletonBar>
        </div>
      </div>
      
      <div class="flex-1 space-y-6 py-1">
        <SkeletonBar class="w-10/12"></SkeletonBar>
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-4">
            <SkeletonBar class="col-span-2"></SkeletonBar>
            <SkeletonBar class="col-span-1"></SkeletonBar>
          </div>
          <SkeletonBar class="w-9/12"></SkeletonBar>
        </div>
      </div>
      
      <div class="flex-1 space-y-6 py-1">
        <SkeletonBar class="w-10/12"></SkeletonBar>
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-4">
            <SkeletonBar class="col-span-2"></SkeletonBar>
          </div>
          <SkeletonBar class="w-9/12"></SkeletonBar>
        </div>
      </div>
      
      <div class="flex-1 space-y-6 py-1">
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-4">
            <SkeletonBar class="col-span-2"></SkeletonBar>
          </div>
          <SkeletonBar class="w-9/12"></SkeletonBar>
        </div>
      </div>
    </div>
  )
}
