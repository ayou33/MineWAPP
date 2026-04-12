import Scroller from '@/provider/Scroller'
import HomeNav from './components/HomeNav'
import HomeHero from './components/HomeHero'
import HomeStats from './components/HomeStats'
import HomeServices from './components/HomeServices'
import HomeProcess from './components/HomeProcess'
import HomeCreators from './components/HomeCreators'
import HomeCta from './components/HomeCta'
import HomeFooter from './components/HomeFooter'

export default function Home () {
  return (
    <Scroller class="h-screen scroll-smooth bg-c-bg">
      <HomeNav />
      <HomeHero />
      <HomeStats />
      <HomeServices />
      <HomeProcess />
      <HomeCreators />
      <HomeCta />
      <HomeFooter />
    </Scroller>
  )
}
