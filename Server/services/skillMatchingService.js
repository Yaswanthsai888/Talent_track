const Job = require('../models/Job');
const User = require('../models/User');

class SkillMatchingService {
    // Calculate skill match percentage
    static calculateSkillMatch(userSkills, jobSkills) {
        if (!userSkills || !jobSkills) return 0;

        const matchedSkills = userSkills.filter(skill => 
            jobSkills.includes(skill)
        );

        const matchPercentage = (matchedSkills.length / jobSkills.length) * 100;
        return Math.round(matchPercentage);
    }

    // Find top matching jobs for a user
    static async findMatchingJobs(userId, options = {}) {
        const {
            limit = 10,
            minMatchPercentage = 50
        } = options;

        // Get user skills
        const user = await User.findById(userId).select('profile.skills');
        if (!user || !user.profile.skills) return [];

        // Find jobs matching user skills
        const jobs = await Job.find({ 
            status: 'active',
            requiredSkills: { $exists: true, $not: { $size: 0 } }
        }).lean();

        // Calculate and filter matching jobs
        const matchedJobs = jobs.map(job => {
            const matchPercentage = this.calculateSkillMatch(
                user.profile.skills, 
                job.requiredSkills
            );

            return {
                ...job,
                matchPercentage,
                isTopMatch: matchPercentage >= minMatchPercentage
            };
        })
        .filter(job => job.matchPercentage >= minMatchPercentage)
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, limit);

        return matchedJobs;
    }

    // Recommend skills to improve job matching
    static recommendSkillUpgrades(userSkills, jobSkills) {
        const missingSkills = jobSkills.filter(
            skill => !userSkills.includes(skill)
        );

        // Group missing skills by category
        const skillCategories = {
            'Must Learn': missingSkills.slice(0, 3),
            'Consider Learning': missingSkills.slice(3, 6)
        };

        return {
            missingSkillCount: missingSkills.length,
            skillCategories
        };
    }

    // Advanced skill similarity matching
    static async findSimilarJobsAndSkills(userId) {
        const user = await User.findById(userId).select('profile.skills');
        if (!user || !user.profile.skills) return null;

        // Use aggregation for complex skill matching
        const similarJobs = await Job.aggregate([
            {
                $match: {
                    status: 'active',
                    requiredSkills: { $exists: true, $not: { $size: 0 } }
                }
            },
            {
                $addFields: {
                    matchedSkillsCount: {
                        $size: {
                            $setIntersection: ['$requiredSkills', user.profile.skills]
                        }
                    }
                }
            },
            {
                $sort: { matchedSkillsCount: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    title: 1,
                    requiredSkills: 1,
                    matchedSkillsCount: 1,
                    matchPercentage: {
                        $multiply: [
                            { $divide: ['$matchedSkillsCount', { $size: '$requiredSkills' }] },
                            100
                        ]
                    }
                }
            }
        ]);

        return similarJobs;
    }
}

module.exports = SkillMatchingService;
