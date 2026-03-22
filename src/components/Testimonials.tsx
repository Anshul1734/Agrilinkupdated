
import React from "react";
import { Star, StarHalf } from "lucide-react";

const Testimonials: React.FC = () => {
  const testimonials = [
    {
      id: 1,
      name: "Jane Smith",
      role: "Regular Customer",
      image: "https://randomuser.me/api/portraits/women/12.jpg",
      content: "I love being able to buy directly from farmers. The produce is much fresher than what I find in supermarkets, and I know I'm supporting local agriculture.",
      rating: 5
    },
    {
      id: 2,
      name: "John Doe",
      role: "Organic Food Enthusiast",
      image: "https://randomuser.me/api/portraits/men/23.jpg",
      content: "Agrilink has completely changed how I shop for groceries. The quality is exceptional, and the ability to learn about where my food comes from adds value.",
      rating: 4.5
    },
    {
      id: 3,
      name: "Alice Johnson",
      role: "Small-scale Farmer",
      image: "https://randomuser.me/api/portraits/women/65.jpg",
      content: "As a farmer, this platform has given me a new channel to reach customers directly. I'm earning more while building relationships with the people who enjoy my produce.",
      rating: 5
    }
  ];

  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 text-yellow-500 fill-yellow-500" />);
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 text-yellow-500 fill-yellow-500" />);
    }

    return stars;
  };

  return (
    <section className="py-16 bg-gradient-to-br from-agrilink-light to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it – hear from our community of farmers and customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white p-6 rounded-lg shadow-md flex flex-col"
            >
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <div className="font-medium">{testimonial.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </div>
              <div className="flex mb-4">
                {renderRating(testimonial.rating)}
              </div>
              <p className="text-gray-700 flex-grow">{testimonial.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
