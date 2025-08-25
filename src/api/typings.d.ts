declare namespace API {
  type AiInterviewRecords = {
    id?: number;
    content?: string;
    sessionId?: string;
    userId?: number;
    type?: string;
    score?: number;
    createTime?: string;
  };

  type AiSession = {
    id?: number;
    name?: string;
    sessionId?: string;
    userId?: number;
    createTime?: string;
  };

  type analyzeVideoParams = {
    url: string;
  };

  type BaseResponseBoolean = {
    code?: number;
    data?: boolean;
    message?: string;
  };

  type BaseResponseInteger = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponseListAiInterviewRecords = {
    code?: number;
    data?: AiInterviewRecords[];
    message?: string;
  };

  type BaseResponseListAiSession = {
    code?: number;
    data?: AiSession[];
    message?: string;
  };

  type BaseResponseListInteger = {
    code?: number;
    data?: number[];
    message?: string;
  };

  type BaseResponseListString = {
    code?: number;
    data?: string[];
    message?: string;
  };

  type BaseResponseLoginUserVO = {
    code?: number;
    data?: LoginUserVO;
    message?: string;
  };

  type BaseResponseLong = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponsePagePost = {
    code?: number;
    data?: PagePost;
    message?: string;
  };

  type BaseResponsePagePostVO = {
    code?: number;
    data?: PagePostVO;
    message?: string;
  };

  type BaseResponsePageQuestion = {
    code?: number;
    data?: PageQuestion;
    message?: string;
  };

  type BaseResponsePageQuestionBank = {
    code?: number;
    data?: PageQuestionBank;
    message?: string;
  };

  type BaseResponsePageQuestionBankQuestion = {
    code?: number;
    data?: PageQuestionBankQuestion;
    message?: string;
  };

  type BaseResponsePageQuestionBankQuestionVO = {
    code?: number;
    data?: PageQuestionBankQuestionVO;
    message?: string;
  };

  type BaseResponsePageQuestionBankVO = {
    code?: number;
    data?: PageQuestionBankVO;
    message?: string;
  };

  type BaseResponsePageQuestionVO = {
    code?: number;
    data?: PageQuestionVO;
    message?: string;
  };

  type BaseResponsePageUser = {
    code?: number;
    data?: PageUser;
    message?: string;
  };

  type BaseResponsePageUserVO = {
    code?: number;
    data?: PageUserVO;
    message?: string;
  };

  type BaseResponsePostVO = {
    code?: number;
    data?: PostVO;
    message?: string;
  };

  type BaseResponseQuestionBankQuestionVO = {
    code?: number;
    data?: QuestionBankQuestionVO;
    message?: string;
  };

  type BaseResponseQuestionBankVO = {
    code?: number;
    data?: QuestionBankVO;
    message?: string;
  };

  type BaseResponseQuestionVO = {
    code?: number;
    data?: QuestionVO;
    message?: string;
  };

  type BaseResponseResumeDocument = {
    code?: number;
    data?: ResumeDocument;
    message?: string;
  };

  type BaseResponseString = {
    code?: number;
    data?: string;
    message?: string;
  };

  type BaseResponseUser = {
    code?: number;
    data?: User;
    message?: string;
  };

  type BaseResponseUserVO = {
    code?: number;
    data?: UserVO;
    message?: string;
  };

  type DeleteRequest = {
    id?: number;
  };

  type Education = {
    degree?: string;
    major?: string;
    university?: string;
    period?: string;
    gpa?: string;
    relevant_courses?: string[];
  };

  type getInterviewDetailBySessionIdParams = {
    sessionId: string;
  };

  type getPostVOByIdParams = {
    id: number;
  };

  type getQuestionBankQuestionVOByIdParams = {
    id: number;
  };

  type getQuestionBankVOByIdParams = {
    questionBankQueryRequest: QuestionBankQueryRequest;
  };

  type getQuestionVOByIdParams = {
    id: number;
  };

  type getUserByIdParams = {
    id: number;
  };

  type getUserSignInRecordParams = {
    year: number;
  };

  type getUserVOByIdParams = {
    id: number;
  };

  type Internship = {
    company?: string;
    position?: string;
    period?: string;
    responsibilities?: string[];
  };

  type LoginUserVO = {
    id?: number;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
    createTime?: string;
    updateTime?: string;
  };

  type OrderItem = {
    column?: string;
    asc?: boolean;
  };

  type PagePost = {
    records?: Post[];
    total?: number;
    size?: number;
    current?: number;
    orders?: OrderItem[];
    optimizeCountSql?: PagePost;
    searchCount?: PagePost;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    pages?: number;
  };

  type PagePostVO = {
    records?: PostVO[];
    total?: number;
    size?: number;
    current?: number;
    orders?: OrderItem[];
    optimizeCountSql?: PagePostVO;
    searchCount?: PagePostVO;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    pages?: number;
  };

  type PageQuestion = {
    records?: Question[];
    total?: number;
    size?: number;
    current?: number;
    orders?: OrderItem[];
    optimizeCountSql?: PageQuestion;
    searchCount?: PageQuestion;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    pages?: number;
  };

  type PageQuestionBank = {
    records?: QuestionBank[];
    total?: number;
    size?: number;
    current?: number;
    orders?: OrderItem[];
    optimizeCountSql?: PageQuestionBank;
    searchCount?: PageQuestionBank;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    pages?: number;
  };

  type PageQuestionBankQuestion = {
    records?: QuestionBankQuestion[];
    total?: number;
    size?: number;
    current?: number;
    orders?: OrderItem[];
    optimizeCountSql?: PageQuestionBankQuestion;
    searchCount?: PageQuestionBankQuestion;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    pages?: number;
  };

  type PageQuestionBankQuestionVO = {
    records?: QuestionBankQuestionVO[];
    total?: number;
    size?: number;
    current?: number;
    orders?: OrderItem[];
    optimizeCountSql?: PageQuestionBankQuestionVO;
    searchCount?: PageQuestionBankQuestionVO;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    pages?: number;
  };

  type PageQuestionBankVO = {
    records?: QuestionBankVO[];
    total?: number;
    size?: number;
    current?: number;
    orders?: OrderItem[];
    optimizeCountSql?: PageQuestionBankVO;
    searchCount?: PageQuestionBankVO;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    pages?: number;
  };

  type PageQuestionVO = {
    records?: QuestionVO[];
    total?: number;
    size?: number;
    current?: number;
    orders?: OrderItem[];
    optimizeCountSql?: PageQuestionVO;
    searchCount?: PageQuestionVO;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    pages?: number;
  };

  type PageUser = {
    records?: User[];
    total?: number;
    size?: number;
    current?: number;
    orders?: OrderItem[];
    optimizeCountSql?: PageUser;
    searchCount?: PageUser;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    pages?: number;
  };

  type PageUserVO = {
    records?: UserVO[];
    total?: number;
    size?: number;
    current?: number;
    orders?: OrderItem[];
    optimizeCountSql?: PageUserVO;
    searchCount?: PageUserVO;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    pages?: number;
  };

  type Post = {
    id?: number;
    title?: string;
    content?: string;
    tags?: string;
    thumbNum?: number;
    favourNum?: number;
    userId?: number;
    createTime?: string;
    updateTime?: string;
    isDelete?: number;
  };

  type PostAddRequest = {
    title?: string;
    content?: string;
    tags?: string[];
  };

  type PostEditRequest = {
    id?: number;
    title?: string;
    content?: string;
    tags?: string[];
  };

  type PostFavourAddRequest = {
    postId?: number;
  };

  type PostFavourQueryRequest = {
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    postQueryRequest?: PostQueryRequest;
    userId?: number;
  };

  type PostQueryRequest = {
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    id?: number;
    notId?: number;
    searchText?: string;
    title?: string;
    content?: string;
    tags?: string[];
    orTags?: string[];
    userId?: number;
    favourUserId?: number;
  };

  type PostThumbAddRequest = {
    postId?: number;
  };

  type PostUpdateRequest = {
    id?: number;
    title?: string;
    content?: string;
    tags?: string[];
  };

  type PostVO = {
    id?: number;
    title?: string;
    content?: string;
    thumbNum?: number;
    favourNum?: number;
    userId?: number;
    createTime?: string;
    updateTime?: string;
    tagList?: string[];
    user?: UserVO;
    hasThumb?: boolean;
    hasFavour?: boolean;
  };

  type Project = {
    name?: string;
    period?: string;
    technologies?: string[];
    description?: string;
    achievements?: string[];
  };

  type Question = {
    id?: number;
    title?: string;
    content?: string;
    tags?: string;
    answer?: string;
    userId?: number;
    editTime?: string;
    createTime?: string;
    updateTime?: string;
    isDelete?: number;
  };

  type QuestionAddRequest = {
    title?: string;
    content?: string;
    tags?: string[];
    answer?: string;
  };

  type QuestionBank = {
    id?: number;
    title?: string;
    description?: string;
    picture?: string;
    userId?: number;
    editTime?: string;
    createTime?: string;
    updateTime?: string;
    isDelete?: number;
  };

  type QuestionBankAddRequest = {
    title?: string;
    description?: string;
    picture?: string;
  };

  type QuestionBankEditRequest = {
    id?: number;
    title?: string;
    description?: string;
    picture?: string;
  };

  type QuestionBankQueryRequest = {
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    id?: number;
    notId?: number;
    searchText?: string;
    title?: string;
    description?: string;
    picture?: string;
    userId?: number;
    needQueryQuestionList?: boolean;
  };

  type QuestionBankQuestion = {
    id?: number;
    questionBankId?: number;
    questionId?: number;
    userId?: number;
    createTime?: string;
    updateTime?: string;
  };

  type QuestionBankQuestionAddRequest = {
    questionBankId?: number;
    questionId?: number;
  };

  type QuestionBankQuestionBatchAddRequest = {
    questionBankId?: number;
    questionIdList?: number[];
  };

  type QuestionBankQuestionBatchRemoveRequest = {
    questionBankId?: number;
    questionIdList?: number[];
  };

  type QuestionBankQuestionQueryRequest = {
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    id?: number;
    notId?: number;
    questionBankId?: number;
    questionId?: number;
    userId?: number;
  };

  type QuestionBankQuestionRemoveRequest = {
    questionBankId?: number;
    questionId?: number;
  };

  type QuestionBankQuestionUpdateRequest = {
    id?: number;
    questionBankId?: number;
    questionId?: number;
  };

  type QuestionBankQuestionVO = {
    id?: number;
    questionBankId?: number;
    questionId?: number;
    userId?: number;
    createTime?: string;
    updateTime?: string;
    tagList?: string[];
    user?: UserVO;
  };

  type QuestionBankUpdateRequest = {
    id?: number;
    title?: string;
    description?: string;
    picture?: string;
  };

  type QuestionBankVO = {
    id?: number;
    title?: string;
    description?: string;
    picture?: string;
    userId?: number;
    createTime?: string;
    updateTime?: string;
    questionPage?: PageQuestionVO;
    user?: UserVO;
  };

  type QuestionBatchRemoveRequest = {
    questionList?: number[];
  };

  type QuestionEditRequest = {
    id?: number;
    title?: string;
    content?: string;
    tags?: string[];
    answer?: string;
  };

  type QuestionQueryRequest = {
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    id?: number;
    notId?: number;
    searchText?: string;
    title?: string;
    content?: string;
    tags?: string[];
    answer?: string;
    userId?: number;
    questionBankId?: number;
  };

  type QuestionUpdateRequest = {
    id?: number;
    title?: string;
    content?: string;
    tags?: string[];
    answer?: string;
  };

  type QuestionVO = {
    id?: number;
    title?: string;
    content?: string;
    userId?: number;
    createTime?: string;
    updateTime?: string;
    tagList?: string[];
    answer?: string;
    user?: UserVO;
  };

  type Resume = {
    job_target?: string;
    basic_info_name?: string;
    basic_info_email?: string;
    basic_info_phone?: string;
    basic_info_github?: string;
    basic_info_linkedin?: string;
    basic_info_location?: string;
    education?: Education[];
    technical_skills_programming_languages?: string[];
    technical_skills_web_development?: string[];
    technical_skills_database?: string[];
    technical_skills_devops?: string[];
    technical_skills_others?: string[];
    projects?: Project[];
    internships?: Internship[];
    certifications?: string[];
    additional_info_languages?: string[];
    additional_info_interests?: string[];
  };

  type ResumeDocument = {
    resume?: Resume;
  };

  type resumeUploadFileAnalyzeLocalParams = {
    biz?: string;
  };

  type SseEmitter = {
    timeout?: number;
  };

  type streamAnalyzeFileParams = {
    fileUrl: string;
  };

  type streamTTSParams = {
    userInputText: string;
  };

  type uploadFileParams = {
    biz?: string;
  };

  type User = {
    id?: number;
    userAccount?: string;
    userPassword?: string;
    unionId?: string;
    mpOpenId?: string;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
    vipExpireTime?: string;
    vipCode?: string;
    vipNumber?: number;
    editTime?: string;
    createTime?: string;
    updateTime?: string;
    isDelete?: number;
  };

  type UserAddRequest = {
    userName?: string;
    userAccount?: string;
    userAvatar?: string;
    userRole?: string;
  };

  type userLoginByWxOpenParams = {
    code: string;
  };

  type UserLoginRequest = {
    userAccount?: string;
    userPassword?: string;
  };

  type UserQueryRequest = {
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    id?: number;
    unionId?: string;
    mpOpenId?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserRegisterRequest = {
    userAccount?: string;
    userPassword?: string;
    checkPassword?: string;
  };

  type UserUpdateMyRequest = {
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
  };

  type UserUpdateRequest = {
    id?: number;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserVO = {
    id?: number;
    userName?: string;
    userAvatar?: string;
    userProfile?: string;
    userRole?: string;
    createTime?: string;
  };
}
