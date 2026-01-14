import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const footerLinks = {
    platform: [
      { name: "How It Works", href: "/how-it-works" },
      { name: "Discover Skills", href: "/discover" },
      { name: "Community", href: "/community" },
      { name: "Success Stories", href: "/stories" },
    ],
    support: [
      { name: "Help Center", href: "/support" },
      { name: "Safety Tips", href: "/safety" },
      { name: "Contact Us", href: "/contact" },
      { name: "FAQ", href: "/faq" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Community Guidelines", href: "/guidelines" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Blog", href: "/blog" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-navy text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-display text-2xl font-semibold mb-2">
                Stay Connected
              </h3>
              <p className="text-white/70">
                Get weekly tips on skill exchange and cultural learning
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 w-full md:w-72"
              />
              <Button variant="terracotta">Subscribe</Button>
            </div>
          </div>
        </div>
      </div>

     

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
            <p>© {new Date().getFullYear()} CultureSwap. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Made for cultural exchange</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;