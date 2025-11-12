class Tool:
    def __init__(self,csv_file):
        self.df=pd.read_csv(csv_file)
    
        
    def chat_with_csv(self,query):
        """
        This function will take the data frame from taken init file and pass it to interact with pandasAI 
        """
        from pandasai.llm.local_llm import LocalLLM
        import pandas as pd 
        from pandasai import SmartDataframe 
         # Initialize LocalLLM with Meta Llama 3 model
        llm = LocalLLM(
        api_base="http://localhost:11434/v1",
        model="llama3.1")
        # Initialize SmartDataframe with DataFrame and LLM configuration
        pandas_ai = SmartDataframe(self.df, config={"llm": llm})
        # Chat with the DataFrame using the provided query
        result = pandas_ai.chat(query)
        return result