'use server';
import { questionSchema, questionAnswerSchema, questionCategorySchema, questionMutationSchema, answerMutationSchema } from '../../schemas/communityQuestion.schema';
import { runQuestionMutation } from './_shared';
export async function saveCommunityQuestion(input: unknown) {
  return runQuestionMutation(questionSchema, input, 'save_community_question', (v) => ({
    target_community: v.communityId, target_id: v.id, expected_version: v.expectedVersion,
    question_title: v.title, question_body: v.body, target_category: v.categoryId, published: v.isPublished,
  }));
}
export async function saveQuestionAnswer(input: unknown) {
  return runQuestionMutation(questionAnswerSchema, input, 'save_community_question_answer', (v) => ({
    target_community: v.communityId, target_question: v.questionId, target_id: v.id,
    expected_version: v.expectedVersion, answer_body: v.body, published: v.isPublished,
  }));
}
export async function saveQuestionCategory(input: unknown) {
  return runQuestionMutation(questionCategorySchema, input, 'save_community_question_category', (v) => ({
    target_community: v.communityId, target_id: v.id, expected_version: v.expectedVersion,
    category_title: v.title, sort_position: v.position, published: v.isPublished, archive: v.archive,
  }));
}
export async function changeCommunityQuestion(input: unknown) {
  return runQuestionMutation(questionMutationSchema, input, 'change_community_question', (v) => ({
    target_community: v.communityId, target_id: v.id, expected_version: v.expectedVersion,
    operation: v.operation, reason: v.reason, target_category: v.categoryId, confirmed: v.confirmed,
  }));
}
export async function changeQuestionAnswer(input: unknown) {
  return runQuestionMutation(answerMutationSchema, input, 'change_community_question_answer', (v) => ({
    target_community: v.communityId, target_question: v.questionId, target_id: v.id,
    expected_version: v.expectedVersion, operation: v.operation, reason: v.reason, confirmed: v.confirmed,
  }));
}
