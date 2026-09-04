import { Helmet } from 'react-helmet-async'
import { BenefitsBar } from '../components/BenefitsBar'
import { Hero } from '../components/Hero'
import { Categories } from '../components/Categories'
import { ProductGrid } from '../components/ProductGrid'
import { FeaturedCollection } from '../components/FeaturedCollection'
import { Promotions } from '../components/Promotions'
import { AboutSection } from '../components/AboutSection'
import { ShoppingExperience } from '../components/ShoppingExperience'
import { InstagramFeed } from '../components/Instagram'
import { Newsletter } from '../components/Newsletter'
import { getFeaturedProducts } from '../data/products'
import { STORE_CONTACT } from '../data/contact'

export function Home() {
  const featured = getFeaturedProducts()

  return (
    <>
      <Helmet>
        <title>Verissimo Pratas 925 — Elegância que permanece</title>
        <meta
          name="description"
          content="Joias em prata 925 com elegância atemporal. Anéis, brincos, colares, pulseiras e berloques. Garantia vitalícia e envio para todo o Brasil."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Verissimo Pratas 925',
            url: 'https://verissimopratas.com.br',
            email: STORE_CONTACT.email,
            telephone: STORE_CONTACT.phoneDisplay,
            sameAs: [STORE_CONTACT.instagramUrl],
          })}
        </script>
      </Helmet>

      <BenefitsBar />
      <Hero />
      <Categories />
      <ProductGrid products={featured} />
      <FeaturedCollection />
      <Promotions />
      <AboutSection />
      <ShoppingExperience />
      <InstagramFeed />
      <Newsletter />
    </>
  )
}
