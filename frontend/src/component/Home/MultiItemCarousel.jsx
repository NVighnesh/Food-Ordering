import React from 'react'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from 'react-slick';
import { topMeal } from './topMeal';
import CarouselItem from './CarouselItem';

const MultiItemCarousel = () => {
      const settings = {
    dots: true,
    infinite: true,
    speed: 900,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay:true,
    autoplaySpeed: 800,
    arrows:false

  };
  return (
    <div>
        <Slider {...settings}>
            {topMeal.map((item) => <CarouselItem image={item.image} title={item.title} />)}
        </Slider>
    </div>
  )
}

export default MultiItemCarousel
