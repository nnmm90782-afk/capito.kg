import { Navbar }             from "./components/navbar";
import { Footer }             from "./components/footer";
import ReviewsSection         from "./components/ReviewsSection";
import PopularDrinksSection   from "./components/PopularDrinksSection";
import {
  Hero,
  AboutPreview,
  BranchesPreview,
  PromoBanner,
  BookingCTA,
} from "./HomeClient";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PopularDrinksSection />
        <AboutPreview />
        <BranchesPreview />
        <ReviewsSection />
        <PromoBanner />
        <BookingCTA />
      </main>
      <Footer />
    </>
  );
}
