"use client";
import "./index.css";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  AcademicCapIcon,
  ChartBarIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  LightBulbIcon,
  SparklesIcon,
  UserGroupIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function HomePage() {
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [featuresRef, featuresInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [statsRef, statsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [ctaRef, ctaInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const features = [
    {
      icon: AcademicCapIcon,
      title: "海量题库资源",
      description: "覆盖前端、后端、算法等多个技术领域的精选题目",
      delay: 0,
    },
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: "AI 模拟面试",
      description: "智能模拟真实面试场景，提供专业的面试反馈",
      delay: 0.1,
    },
    {
      icon: LightBulbIcon,
      title: "智能学习路径",
      description: "根据个人能力定制专属学习计划",
      delay: 0.2,
    },
    {
      icon: UserGroupIcon,
      title: "社区交流",
      description: "与其他开发者分享经验，共同进步",
      delay: 0.3,
    },
  ];

  return (
    <div id="homePage">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="hero-section"
      >
        <div className="hero-background">
          <div className="hero-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>

        <div className="hero-container">
          <div className="hero-content">
            <motion.div variants={fadeIn} className="hero-badge">
              <SparklesIcon className="hero-badge-icon" />
              <span>AI 驱动的面试体验</span>
            </motion.div>

            <motion.h1 variants={scaleIn} className="hero-title">
              <span className="text-accent">智面星图</span>AI评测平台
            </motion.h1>

            <motion.p variants={fadeInUp} className="hero-description">
              利用人工智能技术，模拟真实面试场景，提供专业反馈，
              <br />
              助你突破面试难关，实现职业理想
            </motion.p>

            <motion.div variants={fadeInUp} className="hero-actions">
              <Link href="/start" className="btn btn-primary">
                开始刷题
                <motion.span
                  className="btn-arrow"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </Link>
              <Link href="/interview" className="btn btn-outline">
                模拟面试
              </Link>
            </motion.div>

            <motion.div variants={fadeIn} className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-number">10,000+</div>
                <div className="hero-stat-label">精选题目</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">98%</div>
                <div className="hero-stat-label">用户好评</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-number">24/7</div>
                <div className="hero-stat-label">随时可用</div>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeIn} className="hero-image-container">
            <div className="hero-image">
              <div className="hero-image-overlay"></div>
              <div className="hero-image-content">
                <div className="hero-image-icon">
                  <VideoCameraIcon className="w-16 h-16" />
                </div>
                <div className="hero-image-text">
                  <h3>AI 模拟面试</h3>
                  <p>体验真实的面试环境</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        ref={featuresRef}
        initial="hidden"
        animate={featuresInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="features-section"
      >
        <div className="section-container">
          <motion.div variants={scaleIn} className="section-header">
            <span className="section-badge">平台特色</span>
            <h2 className="section-title">为什么选择我们的平台？</h2>
            <p className="section-description">
              我们提供全方位的面试准备服务，帮助你在技术面试中脱颖而出
            </p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                custom={index}
                className="feature-card"
                style={{ "--delay": `${feature.delay}s` } as any}
              >
                <div className="feature-icon-wrapper">
                  <feature.icon className="feature-icon" />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Statistics & Benefits Section */}
      <motion.section
        ref={statsRef}
        initial="hidden"
        animate={statsInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="stats-section"
      >
        <div className="section-container">
          <div className="stats-grid">
            <motion.div variants={fadeInUp} className="stats-content">
              <span className="section-badge">为什么选择 AI 面试</span>
              <h2 className="section-title">AI 面试助你提升竞争力</h2>

              <div className="stats-items">
                <div className="stat-item">
                  <div className="stat-number">98%</div>
                  <div className="stat-text">的用户表示面试能力得到提升</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">10000+</div>
                  <div className="stat-text">道精选面试题目</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">24/7</div>
                  <div className="stat-text">随时随地开始模拟面试</div>
                </div>
              </div>

              <div className="stats-cta">
                <Link href="/start" className="btn btn-primary">
                  立即体验
                </Link>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="benefits-list">
              <div className="benefit-item">
                <CheckCircleIcon className="benefit-icon" />
                <div>
                  <h3 className="benefit-title">真实面试场景</h3>
                  <p className="benefit-description">
                    AI模拟真实面试官的提问方式和评价标准
                  </p>
                </div>
              </div>
              <div className="benefit-item">
                <ChartBarIcon className="benefit-icon" />
                <div>
                  <h3 className="benefit-title">详细的反馈报告</h3>
                  <p className="benefit-description">
                    获得专业的答题分析和改进建议
                  </p>
                </div>
              </div>
              <div className="benefit-item">
                <AcademicCapIcon className="benefit-icon" />
                <div>
                  <h3 className="benefit-title">持续学习提升</h3>
                  <p className="benefit-description">
                    根据面试表现定制专属学习计划
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section
        ref={ctaRef}
        initial="hidden"
        animate={ctaInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="cta-section"
      >
        <div className="section-container">
          <motion.div variants={scaleIn} className="section-header">
            <span className="section-badge">开始使用</span>
            <h2 className="section-title">准备好开始你的面试之旅了吗？</h2>
            <p className="section-description">
              选择适合你的方式，开始提升面试能力
            </p>
          </motion.div>

          <div className="cta-cards">
            <motion.div variants={fadeInUp} className="cta-card">
              <div className="cta-card-icon">
                <DocumentTextIcon className="cta-icon" />
              </div>
              <h3 className="cta-card-title">刷题训练</h3>
              <p className="cta-card-description">
                海量题库覆盖各类面试考点，帮助你全面备战
              </p>
              <Link href="/questions" className="cta-card-link">
                开始刷题 <span className="cta-arrow">→</span>
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="cta-card featured">
              <div className="cta-card-badge">推荐</div>
              <div className="cta-card-icon">
                <VideoCameraIcon className="cta-icon" />
              </div>
              <h3 className="cta-card-title">模拟面试</h3>
              <p className="cta-card-description">
                AI驱动的真实面试体验，提供专业的反馈建议
              </p>
              <Link href="/interview" className="cta-card-link">
                立即体验 <span className="cta-arrow">→</span>
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="cta-card">
              <div className="cta-card-icon">
                <UserGroupIcon className="cta-icon" />
              </div>
              <h3 className="cta-card-title">社区交流</h3>
              <p className="cta-card-description">
                加入学习社区，与其他求职者交流经验
              </p>
              <Link href="/community" className="cta-card-link">
                加入社区 <span className="cta-arrow">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
