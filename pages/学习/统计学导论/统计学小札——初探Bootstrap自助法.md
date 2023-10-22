- **Bootstrap的核心观点在于：** *既然样本是抽出来的，那为什么不从样本中再抽样（Resample）？* 这点和Jackknife刚好相反，Jackknife（去一法）每次估计的时候去掉一个观测值进行估计（既然样本是抽出来的，那为什么不丢掉几个看看效果）。如果不知道总体分布（或叫理论分布），那么，对总体分布的最好猜测便是由样本数据提供的（经验）分布。
- **Bootstrap的主要思想和一般步骤如下：**
  * 假设样本就是总体：从样本中抽取一个独立同分布的样本  $X_{1}^{*} , . . . , X_{n}^{*}$ 等价于从原始数据 $\{ X_{1},X_{n} \}$ 中有放回地抽取 $n$ 个观测值。
  * 采用再抽样技术（Re-sample）从原始样本中抽取一定数量的样本，此过程允许重复抽样.
  * 基于产生的新样本，计算我们需要估计的统计量T。
  * 重复以上步骤 $n$ （一般是n>1000次）次.
  * 最后计算被估计量  $T_{i}$  的均值 $\overline X$ 和方差 $\hat S$ 。（均值就是对目标统计量的估计，方差就是对估计量的标准误差的bootstrap估计）
- **具体数学表达如下：**
  ![100](https://img-blog.csdn.net/20131229192754796?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdGtpbmdyZXR1cm4=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center#pic_center)
  ![100](https://img-blog.csdn.net/20131229192816265?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvdGtpbmdyZXR1cm4=/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center#pic_center)
- **实践操作：**
	- ```python
	  #VANS.py	
	  #假设我在一辆封闭的地铁上，随机向100个乘客得瑟”没人了我占十个座你也管不着。“，于是我收到来自39个地铁铁判官的大逼斗子。请通过bootstrap法对此时地铁上地铁判官占总人数的比例进行估计。  
	  
	  import numpy as np  
	  from sklearn.utils import resample  
	  
	  
	  def scalejudge(samples):  
	    count = 0.0  
	    total = samples.size  
	    for colour in samples:  
	        if (colour == 1):  
	            count += 1.0  
	    return count / total  
	  
	  
	  Metro_judge = (np.ones(39))  
	  Metro_nobody = (np.zeros(61))  
	  
	  # judge / nobody + judge = 0.40  
	  
	  all = np.hstack((Metro_judge, Metro_nobody))  
	  np.random.shuffle(all)  
	  scale = 0.0  
	  samples = []  
	  variance = 0.0  
	  iter = 10000  
	  
	  for i in range(iter):  
	    bootstrapSamples = resample(all, n_samples=1000, replace=1)  
	    samples.append(bootstrapSamples)  
	    tempscale = scalejudge(bootstrapSamples)  
	    scale += tempscale  
	  
	  for sample in samples:  
	     variance += ((scalejudge(sample)-scale)/iter)**2  
	  
	  
	  
	  print(scale / iter)#计算均值  
	  print(variance/(iter-1))#计算方差  
	  ```
	- **输出结果如下：**
	  0.39016229999999796
	  0.15221139768161274
	  结果表明此时地铁中地铁判官的比例估计值为0.39016229999999796，标准差为0.15221139768161274。
- **小结**：
	- bootstrap自助法作为一种统计方法，具有以下优点：
	  1. 无需假设分布：Bootstrap自助法不对数据的分布进行假设，适用于各种类型的数据，包括非正态分布的数据。
	  2. 适用于小样本：Bootstrap自助法可以在小样本情况下进行推断，有效解决样本量不足的问题。
	  3. 能够估计各种统计指标：Bootstrap自助法可以估计各种统计指标的置信区间，包括均值、中位数、标准差等。
	  4. 考虑了样本间的相关性：Bootstrap自助法通过有放回地抽样，可以考虑样本之间的相关性，更贴近实际情况。
	- 然而，Bootstrap自助法也存在一些局限性：
	  1. 计算成本较高：Bootstrap自助法需要进行多次重复抽样，并进行统计指标的计算，计算成本较高。
	  2. 对异常值敏感：如果样本中存在异常值，Bootstrap自助法可能会对其进行重复抽样，进而影响估计结果的准确性。
	  3. 无法解决缺失数据问题：如果样本中存在缺失数据，Bootstrap自助法无法直接解决，需要进行额外的处理。
	  4. 对样本分布的要求较高：虽然Bootstrap自助法不对数据的分布做出假设，但在样本分布极端或非典型的情况下，Bootstrap自助法的结果可能不准确。
	  5. 自助法需要的关键条件是阿达玛可微。
	- Bootstrap自助法还有很多深度的内容可以挖掘，本文作为一篇小札，除了介绍这样一种统计方法，也是对自己学习过程的记录。其中很多内容也是通过信息检索而来，理解方面可能也有偏差，在此做学习交流，抛砖引玉之用途，欢迎大家批评指正。