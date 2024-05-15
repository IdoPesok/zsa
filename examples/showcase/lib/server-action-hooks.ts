"use client"

export const ActionKeyFactory = {
  getRandomNumber: () => ["getRandomNumber"] as const,
  posts: () => ["posts"] as const,
  postsList: () => ["posts", "list"] as const,
  postDetails: (id: string) => ["posts", "details", id] as const,
}
